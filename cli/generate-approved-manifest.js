#!/usr/bin/env node

/**
 * Generate an approval-ready distilled manifest from the local action-intelligence outputs.
 *
 * This keeps raw personal material local while producing a publishable, approved-only
 * manifest for TNF's private knowledge pipeline.
 */

const fs = require('fs');
const path = require('path');

const config = require('../lib/config');

const PERSONAL_DATA_DIR = config.personalDataDir || config.personalDataPath;
const REPORTS_DIR = config.reportsDir;
const ACTION_DIR = path.join(PERSONAL_DATA_DIR, 'knowledge-base', 'action-intelligence');
const SPRINT_FILE = path.join(ACTION_DIR, 'tnf-sprint.json');
const SOURCE_INDEX_FILE = path.join(ACTION_DIR, 'source-index.json');
const OUTPUT_DIR = path.join(ACTION_DIR, 'approved-manifests');

function readArg(flag, fallbackValue) {
  const args = process.argv.slice(2);
  const match = args.find((arg) => arg.startsWith(`${flag}=`));
  if (!match) return fallbackValue;
  return match.slice(flag.length + 1);
}

function parseArgInt(flag, fallbackValue) {
  const value = readArg(flag);
  if (!value) return fallbackValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function truncate(value, maxLength = 240) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function buildItem(ticket, report) {
  const implementationSteps = Array.isArray(ticket.implementationSteps)
    ? ticket.implementationSteps.filter(Boolean)
    : [];

  const summaryChunk = {
    externalChunkId: `${ticket.id}:summary`,
    chunkIndex: 0,
    title: 'Why This Matters Now',
    content: ticket.whyNow,
    summary: truncate(ticket.whyNow, 140),
    approvedForVectorization: true,
    approvalNotes: 'Approved distilled strategic summary for TNF semantic retrieval',
    metadata: {
      sprintTicketId: ticket.id,
      sourceIndex: ticket.sourceIndex,
      domain: ticket.domain,
      priority: ticket.priority,
      chunkType: 'why_now',
    },
  };

  const implementationChunk = {
    externalChunkId: `${ticket.id}:implementation`,
    chunkIndex: 1,
    title: 'Implementation Direction',
    content: [
      `Objective: ${ticket.objective}`,
      '',
      'Implementation Steps:',
      ...implementationSteps.map((step, index) => `${index + 1}. ${step}`),
      '',
      `First Deliverable: ${ticket.firstDeliverable}`,
    ].join('\n'),
    summary: ticket.firstDeliverable,
    approvedForVectorization: true,
    approvalNotes: 'Approved distilled implementation plan for TNF semantic retrieval',
    metadata: {
      sprintTicketId: ticket.id,
      sourceIndex: ticket.sourceIndex,
      domain: ticket.domain,
      priority: ticket.priority,
      chunkType: 'implementation_plan',
    },
  };

  const actions = [
    ...implementationSteps.map((step, index) => ({
      externalActionId: `${ticket.id}:step:${index + 1}`,
      title: `${ticket.domain}: ${step}`,
      description: `Derived from ${ticket.title}`,
      status: 'PROPOSED',
      priority: index === 0 ? 'HIGH' : 'MEDIUM',
      confidenceScore: Math.max(70, 96 - index * 4),
      metadata: {
        sprintTicketId: ticket.id,
        sourceIndex: ticket.sourceIndex,
        actionType: 'implementation_step',
        order: index + 1,
      },
    })),
    {
      externalActionId: `${ticket.id}:deliverable`,
      title: ticket.firstDeliverable,
      description: `First concrete deliverable for ${ticket.title}`,
      status: 'PROPOSED',
      priority: 'HIGH',
      confidenceScore: 92,
      metadata: {
        sprintTicketId: ticket.id,
        sourceIndex: ticket.sourceIndex,
        actionType: 'first_deliverable',
      },
    },
  ];

  return {
    source: {
      externalId: `youtube:distilled:${report.videoId || ticket.sourceIndex}`,
      sourceKind: 'YOUTUBE_PLAYLIST',
      title: ticket.title,
      canonicalUrl: ticket.sourceUrl || report.url,
      storageProvider: 'LOCAL_DISK',
      storageLocator: report.fileName ? path.join(REPORTS_DIR, report.fileName) : REPORTS_DIR,
      sourceCreatedAt: report.processedAt || report.mtime || undefined,
      discoveredAt: report.processedAt || report.mtime || undefined,
      freshnessScore: report.priorityScore || Math.max(0, 300 - ticket.priority * 10),
      approvalNotes: 'Approved distilled content derived from private local action-intelligence outputs',
      metadata: {
        sourceIndex: ticket.sourceIndex,
        sprintTicketId: ticket.id,
        reportType: report.reportType,
        primaryDomain: report.primaryDomain || ticket.domain,
        fileName: report.fileName,
        latestQueuePriority: ticket.priority,
      },
    },
    chunks: [summaryChunk, implementationChunk],
    actions,
  };
}

function main() {
  const limit = parseArgInt('--limit', 5);
  const tenantId = readArg('--tenant-id', 'super-admin-personal');
  const workspaceId = readArg('--workspace-id', undefined);

  if (!fs.existsSync(SPRINT_FILE)) {
    throw new Error(`Missing sprint file: ${SPRINT_FILE}`);
  }

  if (!fs.existsSync(SOURCE_INDEX_FILE)) {
    throw new Error(`Missing source index file: ${SOURCE_INDEX_FILE}`);
  }

  const sprint = readJson(SPRINT_FILE);
  const sourceIndex = readJson(SOURCE_INDEX_FILE);
  const reports = Array.isArray(sourceIndex.reports) ? sourceIndex.reports : [];
  const reportByIndex = new Map(reports.map((report) => [report.index, report]));

  const selected = sprint.slice(0, limit);
  if (selected.length === 0) {
    throw new Error('No sprint items found to convert into an approved manifest');
  }

  const items = selected.map((ticket) => {
    const report = reportByIndex.get(ticket.sourceIndex);
    if (!report) {
      throw new Error(`No source-index entry found for sprint item ${ticket.id} at index ${ticket.sourceIndex}`);
    }
    return buildItem(ticket, report);
  });

  const manifest = {
    tenantId,
    workspaceId,
    generatedAt: new Date().toISOString(),
    generatedFrom: {
      sprintFile: SPRINT_FILE,
      sourceIndexFile: SOURCE_INDEX_FILE,
      limit,
    },
    approvalMode: 'pre-approved-distilled-only',
    items,
  };

  ensureDir(OUTPUT_DIR);
  const timestamp = timestampForFile();
  const timestampedPath = path.join(OUTPUT_DIR, `approved-private-intelligence-${timestamp}.json`);
  const latestPath = path.join(OUTPUT_DIR, 'approved-private-intelligence-latest.json');

  fs.writeFileSync(timestampedPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(manifest, null, 2));

  console.log('Approved manifest generated');
  console.log(`Items: ${items.length}`);
  console.log(`Latest: ${latestPath}`);
  console.log(`Snapshot: ${timestampedPath}`);
}

main();
