#!/usr/bin/env node

/**
 * Publish an approval-gated distilled knowledge manifest into TNF.
 *
 * Raw personal files stay local or in user-controlled cloud storage.
 * This script only sends the approved distilled layer to TNF.
 *
 * Usage:
 *   node cli/publish-approved-intelligence.js \
 *     --manifest=/absolute/path/to/approved-private-intelligence.json \
 *     --api-base=http://localhost:3000/api \
 *     --token=$TNF_API_TOKEN
 *
 * Optional embedding generation:
 *   node cli/publish-approved-intelligence.js ... --embed
 *
 * When --embed is enabled, chunks marked approvedForVectorization=true and
 * missing an embedding will be embedded locally with the OpenAI embeddings API.
 */

const fs = require('fs');
const path = require('path');

function readArg(flag, fallbackValue = undefined) {
  const args = process.argv.slice(2);
  const match = args.find((arg) => arg.startsWith(`${flag}=`));
  if (!match) return fallbackValue;
  return match.slice(flag.length + 1);
}

function hasFlag(flag) {
  return process.argv.slice(2).includes(flag);
}

function requiredArg(flag) {
  const value = readArg(flag);
  if (!value) {
    throw new Error(`Missing required argument: ${flag}=...`);
  }
  return value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest must be a JSON object');
  }

  if (!Array.isArray(manifest.items) || manifest.items.length === 0) {
    throw new Error('Manifest must include a non-empty items array');
  }

  manifest.items.forEach((item, index) => {
    if (!item.source || typeof item.source !== 'object') {
      throw new Error(`items[${index}].source is required`);
    }

    if (!isNonEmptyString(item.source.externalId)) {
      throw new Error(`items[${index}].source.externalId is required`);
    }

    if (!isNonEmptyString(item.source.title)) {
      throw new Error(`items[${index}].source.title is required`);
    }

    if (!Array.isArray(item.chunks) || item.chunks.length === 0) {
      throw new Error(`items[${index}].chunks must be a non-empty array`);
    }

    item.chunks.forEach((chunk, chunkIndex) => {
      if (!Number.isInteger(chunk.chunkIndex)) {
        throw new Error(`items[${index}].chunks[${chunkIndex}].chunkIndex must be an integer`);
      }

      if (!isNonEmptyString(chunk.content)) {
        throw new Error(`items[${index}].chunks[${chunkIndex}].content is required`);
      }

      if (chunk.embedding && !Array.isArray(chunk.embedding)) {
        throw new Error(`items[${index}].chunks[${chunkIndex}].embedding must be an array`);
      }

      if (chunk.embedding && chunk.approvedForVectorization !== true) {
        throw new Error(
          `items[${index}].chunks[${chunkIndex}] has an embedding but approvedForVectorization is not true`
        );
      }
    });
  });
}

async function generateEmbedding(text, model) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when --embed is used');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  const embedding = payload && payload.data && payload.data[0] && payload.data[0].embedding;
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding response did not include an embedding vector');
  }

  return embedding;
}

async function attachEmbeddings(manifest, model) {
  let generated = 0;

  for (const item of manifest.items) {
    for (const chunk of item.chunks) {
      if (chunk.approvedForVectorization !== true) continue;
      if (Array.isArray(chunk.embedding) && chunk.embedding.length > 0) continue;

      chunk.embedding = await generateEmbedding(
        [chunk.title, chunk.summary, chunk.content].filter(Boolean).join('\n\n'),
        model
      );
      chunk.embeddingModel = model;
      generated += 1;
    }
  }

  return generated;
}

function buildPayload(manifest) {
  return {
    tenantId: isNonEmptyString(manifest.tenantId) ? manifest.tenantId.trim() : undefined,
    workspaceId: isNonEmptyString(manifest.workspaceId) ? manifest.workspaceId.trim() : undefined,
    items: manifest.items.map((item) => ({
      source: {
        externalId: item.source.externalId.trim(),
        sourceKind: item.source.sourceKind,
        title: item.source.title.trim(),
        canonicalUrl: item.source.canonicalUrl,
        storageProvider: item.source.storageProvider,
        storageLocator: item.source.storageLocator,
        sourceCreatedAt: item.source.sourceCreatedAt,
        discoveredAt: item.source.discoveredAt,
        freshnessScore: item.source.freshnessScore,
        approvalNotes: item.source.approvalNotes,
        metadata: item.source.metadata || {},
      },
      chunks: item.chunks.map((chunk) => ({
        externalChunkId: chunk.externalChunkId,
        chunkIndex: chunk.chunkIndex,
        title: chunk.title,
        content: chunk.content.trim(),
        summary: chunk.summary,
        approvedForVectorization: chunk.approvedForVectorization === true,
        approvalNotes: chunk.approvalNotes,
        tokenEstimate: chunk.tokenEstimate,
        metadata: chunk.metadata || {},
        embedding: Array.isArray(chunk.embedding) ? chunk.embedding : undefined,
        embeddingModel: chunk.embeddingModel,
      })),
      actions: Array.isArray(item.actions)
        ? item.actions.map((action) => ({
            externalActionId:
              action.externalActionId ||
              `${item.source.externalId.trim()}:${slugify(action.title || 'action')}`,
            title: String(action.title || '').trim(),
            description: action.description,
            status: action.status,
            priority: action.priority,
            confidenceScore: action.confidenceScore,
            metadata: action.metadata || {},
          }))
        : [],
    })),
  };
}

async function publish(payload, apiBase, token) {
  const endpoint = `${apiBase.replace(/\/+$/, '')}/private-knowledge/approved-batches`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `TNF publish failed (${response.status}): ${
        typeof body === 'string' ? body : JSON.stringify(body, null, 2)
      }`
    );
  }

  return body;
}

async function main() {
  const manifestPath = path.resolve(requiredArg('--manifest'));
  const apiBase = readArg('--api-base', 'http://localhost:3000/api');
  const token = requiredArg('--token');
  const embed = hasFlag('--embed');
  const embeddingModel = readArg('--embed-model', 'text-embedding-3-small');

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifest = readJson(manifestPath);
  validateManifest(manifest);

  let generatedEmbeddings = 0;
  if (embed) {
    generatedEmbeddings = await attachEmbeddings(manifest, embeddingModel);
  }

  const payload = buildPayload(manifest);
  const result = await publish(payload, apiBase, token);

  console.log('Approved knowledge published');
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Items: ${payload.items.length}`);
  console.log(`Embeddings generated locally: ${generatedEmbeddings}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`Publish failed: ${error.message}`);
  process.exit(1);
});
