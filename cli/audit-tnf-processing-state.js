#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const config = require('../lib/config');

const PERSONAL_DATA_DIR = config.personalDataDir || config.personalDataPath;
const ACTION_DIR = path.join(PERSONAL_DATA_DIR, 'knowledge-base', 'action-intelligence');
const PRIVATE_CATALOG = path.join(PERSONAL_DATA_DIR, 'notebooklm-exports', 'videos-catalog.json');
const TNF_STATE = '/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/packages/gemini-browser-skill/data/processing_state.json';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeStateVideo(video) {
  return {
    index: video.index || 0,
    videoId: video.videoId || '',
    url: video.url || '',
    title: video.title || '',
    status: video.status || 'unknown',
    analysisPath: video.analysisPath || null,
    hasImportedAnalysis: Boolean(video.analysisPath || video.analysis?.imported)
  };
}

function dedupeByIndex(videos) {
  const seen = new Set();
  const result = [];
  for (const video of videos) {
    if (seen.has(video.index)) {
      continue;
    }
    seen.add(video.index);
    result.push(video);
  }
  return result.sort((a, b) => a.index - b.index);
}

function write(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function renderMd(summary) {
  return [
    '# TNF Batch Audit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Result',
    '',
    summary.hasNewExternalBatch
      ? '- TNF contains external videos not present in the private catalog.'
      : '- TNF does not contain a newer external batch. It is a parallel processing state for the same library.',
    `- Private catalog count: ${summary.privateCount}`,
    `- TNF deduped count: ${summary.tnfDedupedCount}`,
    `- TNF imported analyses: ${summary.importedCount}`,
    `- TNF needs visual review: ${summary.needsVisualCount}`,
    '',
    '## Notes',
    '',
    '- The private corpus should remain the system of record for raw personal knowledge.',
    '- TNF processing state is useful as operational metadata, not as the primary storage boundary.',
    '- If a truly new batch appears later, it should be imported into the private corpus first, then re-ranked.',
    '',
    '## Missing From Private Catalog',
    ''
  ].concat(
    summary.missingFromPrivate.length === 0
      ? ['- None']
      : summary.missingFromPrivate.slice(0, 20).map(video => `- #${video.index} ${video.title} (${video.url})`)
  ).concat([
    '',
    '## Freshest Relevant TNF Items',
    ''
  ]).concat(
    summary.freshestTnf.slice(0, 15).map(video =>
      `- #${video.index} ${video.title} [${video.status}]`
    )
  ).join('\n');
}

function main() {
  const privateCatalog = JSON.parse(fs.readFileSync(PRIVATE_CATALOG, 'utf8'));
  const tnfState = JSON.parse(fs.readFileSync(TNF_STATE, 'utf8'));

  const privateByVideoId = new Map(privateCatalog.map(video => [video.videoId, video]));
  const privateByIndex = new Map(privateCatalog.map(video => [video.index, video]));

  const tnfVideos = dedupeByIndex((tnfState.videos || []).map(normalizeStateVideo));
  const missingFromPrivate = tnfVideos.filter(video => {
    if (video.videoId && privateByVideoId.has(video.videoId)) {
      return false;
    }
    return !privateByIndex.has(video.index);
  });

  const imported = tnfVideos.filter(video => video.hasImportedAnalysis);
  const needsVisual = tnfVideos.filter(video => video.status === 'needs_visual');
  const freshestTnf = tnfVideos
    .filter(video => video.index > 0)
    .sort((a, b) => a.index - b.index);

  const summary = {
    generatedAt: new Date().toISOString(),
    privateCount: privateCatalog.length,
    tnfDedupedCount: tnfVideos.length,
    importedCount: imported.length,
    needsVisualCount: needsVisual.length,
    hasNewExternalBatch: missingFromPrivate.length > 0,
    missingFromPrivate,
    freshestTnf
  };

  write(path.join(ACTION_DIR, 'tnf-batch-audit.json'), JSON.stringify(summary, null, 2));
  write(path.join(ACTION_DIR, 'tnf-batch-audit.md'), renderMd(summary));

  console.log('✅ TNF batch audit written');
  console.log(`   Missing from private catalog: ${missingFromPrivate.length}`);
  console.log(`   Imported analyses in TNF: ${imported.length}`);
  console.log(`   Needs visual review: ${needsVisual.length}`);
}

main();
