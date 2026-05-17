#!/usr/bin/env node

/**
 * Build a local-only action intelligence layer from private video reports.
 *
 * This script scans the private knowledge base, ranks recent high-value items,
 * and generates actionable initiative drafts without writing personal data back
 * into the application repository.
 */

const fs = require('fs');
const path = require('path');

const config = require('../lib/config');

const PERSONAL_DATA_DIR = config.personalDataDir || config.personalDataPath || path.dirname(config.reportsDir);
const REPORTS_DIR = config.reportsDir;
const ACTION_DIR = path.join(PERSONAL_DATA_DIR, 'knowledge-base', 'action-intelligence');
const CATALOG_FILE = path.join(PERSONAL_DATA_DIR, 'notebooklm-exports', 'videos-catalog.json');
const CATALOG_ORDER = 'newest-first';

const DOMAIN_DEFINITIONS = [
  {
    id: 'tnf_orchestration',
    label: 'TNF Orchestration',
    weight: 30,
    keywords: [
      'agent', 'orchestration', 'workflow', 'multi-agent', 'autonomous',
      'mcp', 'a2a', 'protocol', 'copilotkit', 'langgraph', 'autogen',
      'crewai', 'smolagents', 'conductor', 'open interpreter'
    ],
    initiativeTitle: 'Upgrade TNF orchestration patterns',
    actionPlan: [
      'Prototype the strongest pattern locally inside TNF before considering SaaS exposure.',
      'Map the pattern to explicit TNF nodes, guardrails, and observability hooks.',
      'Keep only the parts that improve reliability, speed, or operator leverage.'
    ],
    successMetric: 'A repeatable orchestration pattern is running locally with clear guardrails and measurable throughput gains.',
    quickMove: 'Prototype the pattern in a local TNF workflow and record what changed versus the current orchestration path.'
  },
  {
    id: 'productized_services',
    label: 'Productized Services',
    weight: 25,
    keywords: [
      'business', 'service', 'agency', 'consulting', 'offer', 'productize',
      'client', 'sales', 'lead', 'cold call', 'marketing', 'revenue',
      'monetiz', 'funnel', 'one-person', 'customer', 'brand'
    ],
    initiativeTitle: 'Turn learned patterns into sellable offers',
    actionPlan: [
      'Translate the source ideas into a narrow service or product offer with a concrete outcome.',
      'Define a TNF delivery workflow that can produce the offer repeatedly with low manual drag.',
      'Attach a pricing, proof, and pilot-client test plan before building more infrastructure.'
    ],
    successMetric: 'Each candidate offer has a scoped deliverable, pricing hypothesis, and a TNF-backed fulfillment workflow.',
    quickMove: 'Write the service promise, input requirements, and delivery workflow for the strongest commercial pattern.'
  },
  {
    id: 'product_building',
    label: 'Product Building',
    weight: 22,
    keywords: [
      'app', 'ui', 'frontend', 'react', 'nextjs', 'nest', 'full-stack',
      'generative ui', 'website', 'builder', 'copilot', 'design os'
    ],
    initiativeTitle: 'Ship product surfaces that demonstrate TNF value',
    actionPlan: [
      'Build the narrowest useful product surface that proves the workflow in real use.',
      'Keep private intelligence local while exposing only the safe UI and execution path in SaaS.',
      'Instrument user and operator feedback so build decisions follow evidence rather than hype.'
    ],
    successMetric: 'A focused TNF product surface exists with a clear user job and measurable adoption feedback.',
    quickMove: 'Select one narrow interface and implement the smallest version that proves the user-facing value.'
  },
  {
    id: 'model_stack',
    label: 'Model Stack',
    weight: 18,
    keywords: [
      'llm', 'model', 'claude', 'gemini', 'openai', 'gpt', 'llama',
      'groq', 'deepseek', 'reasoning', 'prompt', 'context engineering'
    ],
    initiativeTitle: 'Continuously sharpen the TNF model routing stack',
    actionPlan: [
      'Extract concrete routing, prompting, and tool-use lessons into TNF model policies.',
      'Benchmark the new pattern locally before changing any production defaults.',
      'Document the exact trigger conditions where the newer approach overrides older assumptions.'
    ],
    successMetric: 'Model routing decisions are based on explicit evidence and recent source-backed policies.',
    quickMove: 'Turn the strongest model insight into a routing or prompting experiment with a pass/fail test.'
  },
  {
    id: 'knowledge_systems',
    label: 'Knowledge Systems',
    weight: 18,
    keywords: [
      'rag', 'retrieval', 'vector', 'embedding', 'search', 'memory',
      'knowledge', 'document', 'notebooklm'
    ],
    initiativeTitle: 'Build a private intelligence layer that compounds over time',
    actionPlan: [
      'Structure private source material into retrievable, version-aware intelligence artifacts.',
      'Prefer newest evidence by default while preserving older reports as historical context.',
      'Expose only derived, safe outputs to SaaS workflows and keep raw personal material local.'
    ],
    successMetric: 'Private knowledge can be searched, ranked by freshness, and turned into implementation decisions quickly.',
    quickMove: 'Move the strongest recent findings into a recency-aware source index and decision ledger.'
  },
  {
    id: 'automation_ops',
    label: 'Automation Ops',
    weight: 16,
    keywords: [
      'automation', 'deployment', 'production', 'scaling', 'ops',
      'monitoring', 'local', 'api', 'browser', 'tool', 'execution'
    ],
    initiativeTitle: 'Harden execution and delivery operations',
    actionPlan: [
      'Test promising automation patterns locally with a clear rollback path.',
      'Add the minimum monitoring and audit trail needed before letting automation touch production pathways.',
      'Promote only patterns that reduce operator load without weakening control.'
    ],
    successMetric: 'Useful automations survive local validation and have clear monitoring, safety, and rollback rules.',
    quickMove: 'Choose one automation pattern and define the guardrails, logs, and rollback path before adoption.'
  }
];

const STRATEGIC_SIGNAL_TERMS = [
  'agent', 'orchestration', 'workflow', 'mcp', 'protocol', 'llm', 'model',
  'claude', 'gemini', 'openai', 'rag', 'retrieval', 'langchain', 'langflow',
  'copilot', 'autogen', 'groq', 'deepseek', 'productize', 'business',
  'service', 'sales', 'marketing', 'ui', 'frontend', 'react', 'nextjs',
  'nest', 'generative ui', 'automation', 'deployment', 'browser', 'routing',
  'context engineering', 'code interpreter', 'offer', 'client'
];

const AI_CORE_TERMS = [
  'ai', 'agent', 'llm', 'model', 'claude', 'gemini', 'openai', 'gpt',
  'rag', 'retrieval', 'langchain', 'langflow', 'copilot', 'autogen',
  'groq', 'deepseek', 'mcp', 'orchestration', 'automation', 'prompt'
];

const OFF_TARGET_TERMS = [
  'crypto', 'nft', 'mushroom', 'cat', 'piano', 'carlin', 'trading',
  'social security', 'vocal eq', 'music video', 'lex fridman podcast',
  'blender', 'geometric deep learning blueprint', 'devil wears prada'
];

function parseArgInt(flag, defaultValue) {
  const args = process.argv.slice(2);
  const match = args.find(arg => arg.startsWith(`${flag}=`));
  if (!match) {
    return defaultValue;
  }
  const parsed = Number.parseInt(match.split('=').slice(1).join('='), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const TOP_LIMIT = parseArgInt('--top', 20);
const RECENT_WINDOW = parseArgInt('--recent', 60);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.warn(`⚠️  Failed to parse JSON: ${filePath}`);
    return fallbackValue;
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function uniqueNonEmpty(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function truncate(value, maxLength = 220) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

function extractSection(content, heading) {
  const pattern = new RegExp(`##\\s+${escapeRegex(heading)}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|\\n---|$)`, 'i');
  return content.match(pattern)?.[1]?.trim() || '';
}

function extractList(sectionText) {
  if (!sectionText) {
    return [];
  }

  return sectionText
    .split('\n')
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(line => line && line.toLowerCase() !== 'none identified');
}

function extractMetadataValue(content, label) {
  const patterns = [
    new RegExp(`\\*\\*${escapeRegex(label)}:\\*\\*\\s*([^\\n]+)`, 'i'),
    new RegExp(`-\\s*\\*\\*${escapeRegex(label)}\\*\\*:\\s*([^\\n]+)`, 'i')
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
}

function parseAnalysisJson(content) {
  const analysisSection = extractSection(content, 'AI Analysis');
  if (!analysisSection) {
    return null;
  }

  const codeBlockMatch = analysisSection.match(/```json\s*([\s\S]*?)```/i);
  const rawJson = codeBlockMatch ? codeBlockMatch[1].trim() : analysisSection.trim();

  try {
    return JSON.parse(rawJson);
  } catch (_error) {
    return null;
  }
}

function inferIndex(content, fileName, catalogEntry) {
  const candidates = [
    extractMetadataValue(content, 'Index').replace('#', '').trim(),
    fileName.match(/^api_(\d+)_/)?.[1],
    fileName.match(/^video_(\d+)_/)?.[1],
    fileName.match(/^transcript_(\d+)_/)?.[1],
    fileName.match(/^v2_(\d+)_/)?.[1],
    catalogEntry?.index
  ];

  for (const candidate of candidates) {
    const parsed = Number.parseInt(candidate, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function inferVideoId(content, fileName, catalogEntry) {
  return (
    extractMetadataValue(content, 'Video ID') ||
    catalogEntry?.videoId ||
    fileName.match(/^api_\d+_([^.]+)\.md$/)?.[1] ||
    ''
  );
}

function inferUrl(content, catalogEntry, videoId) {
  return (
    extractMetadataValue(content, 'URL') ||
    catalogEntry?.url ||
    (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')
  );
}

function inferTitle(content, fileName, catalogEntry) {
  const firstHeading = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || '';
  if (firstHeading && firstHeading.toLowerCase() !== 'video analysis report') {
    return firstHeading;
  }

  const metadataTitle = extractMetadataValue(content, 'Video');
  if (metadataTitle) {
    return metadataTitle;
  }

  if (catalogEntry?.title) {
    return catalogEntry.title;
  }

  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/^(api|video|transcript|v2)_\d+(_seg\d+)?_/, '')
    .replace(/_\d{10,}$/, '')
    .replace(/_/g, ' ')
    .trim();
}

function inferProcessedAt(content) {
  return (
    extractMetadataValue(content, 'Processed') ||
    ''
  );
}

function inferSummary(content, parsedAnalysis) {
  if (parsedAnalysis?.summary) {
    return truncate(parsedAnalysis.summary, 400);
  }

  const summarySection = extractSection(content, 'Summary');
  if (!summarySection) {
    return '';
  }

  if (summarySection.startsWith('{') && summarySection.includes('"summary"')) {
    try {
      return truncate(JSON.parse(summarySection).summary || '', 400);
    } catch (_error) {
      return truncate(summarySection, 400);
    }
  }

  return truncate(summarySection, 400);
}

function inferKeyPoints(content, parsedAnalysis) {
  if (Array.isArray(parsedAnalysis?.keyPoints)) {
    return uniqueNonEmpty(parsedAnalysis.keyPoints.map(point => truncate(point, 260)));
  }

  return extractList(extractSection(content, 'Key Points')).map(point => truncate(point, 260));
}

function inferConcepts(content, parsedAnalysis) {
  if (Array.isArray(parsedAnalysis?.aiConcepts)) {
    return uniqueNonEmpty(parsedAnalysis.aiConcepts.map(item => truncate(item, 120)));
  }

  return extractList(extractSection(content, 'AI & Technical Concepts')).map(item => truncate(item, 120));
}

function inferTechnicalDetails(content, parsedAnalysis) {
  if (Array.isArray(parsedAnalysis?.technicalDetails)) {
    return uniqueNonEmpty(parsedAnalysis.technicalDetails.map(item => truncate(item, 140)));
  }

  return extractList(extractSection(content, 'Technical Details')).map(item => truncate(item, 140));
}

function domainMatches(reportText, domain) {
  const normalized = reportText.toLowerCase();
  return domain.keywords.filter(keyword => normalized.includes(keyword.toLowerCase()));
}

function scoreReport(report, maxIndex) {
  const searchText = [
    report.title,
    report.summary,
    ...report.keyPoints,
    ...report.aiConcepts,
    ...report.technicalDetails
  ].join(' ').toLowerCase();

  const matchedDomains = DOMAIN_DEFINITIONS
    .map(domain => {
      const matches = domainMatches(searchText, domain);
      if (matches.length === 0) {
        return null;
      }

      return {
        id: domain.id,
        label: domain.label,
        weight: domain.weight,
        matches,
        matchCount: matches.length
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }
      return right.weight - left.weight;
    });

  const strategicSignalCount = STRATEGIC_SIGNAL_TERMS.filter(term => searchText.includes(term)).length;
  const aiCoreCount = AI_CORE_TERMS.filter(term => searchText.includes(term)).length;
  const offTargetCount = OFF_TARGET_TERMS.filter(term => searchText.includes(term)).length;
  const relevanceScore = matchedDomains.reduce(
    (sum, match) => sum + match.weight + Math.min(match.matchCount, 3) * 3,
    0
  ) + strategicSignalCount * 4 - offTargetCount * 25;

  const recencyRank = report.index > 0 && maxIndex > 0
    ? CATALOG_ORDER === 'newest-first'
      ? maxIndex - report.index + 1
      : report.index
    : 0;
  const recencyScore = recencyRank > 0 && maxIndex > 0
    ? Math.round((recencyRank / maxIndex) * 30)
    : 0;
  const freshnessBonus = CATALOG_ORDER === 'newest-first'
    ? report.index <= 25
      ? 10
      : report.index <= 50
        ? 5
        : 0
    : report.index >= maxIndex - 24
      ? 10
      : report.index >= maxIndex - 49
        ? 5
        : 0;
  const qualityScore = (report.summary ? 6 : 0)
    + Math.min(report.keyPoints.length, 8)
    + Math.min(report.aiConcepts.length, 4);

  return {
    ...report,
    matchedDomains,
    primaryDomain: matchedDomains[0] || null,
    strategicSignalCount,
    aiCoreCount,
    offTargetCount,
    relevanceScore,
    recencyScore,
    qualityScore,
    priorityScore: relevanceScore + recencyScore + freshnessBonus + qualityScore,
    isRelevant:
      matchedDomains.length > 0 &&
      strategicSignalCount > 0 &&
      aiCoreCount > 0 &&
      relevanceScore >= 45 &&
      !(offTargetCount > 0 && aiCoreCount < 2)
  };
}

function loadCatalog() {
  const catalog = readJsonFile(CATALOG_FILE, []);
  const byVideoId = new Map();
  const byIndex = new Map();

  for (const entry of catalog) {
    if (entry.videoId) {
      byVideoId.set(entry.videoId, entry);
    }
    if (Number.isFinite(entry.index)) {
      byIndex.set(entry.index, entry);
    }
  }

  return { items: catalog, byVideoId, byIndex };
}

function parseReportFile(fileName, catalogMaps, maxIndex) {
  const filePath = path.join(REPORTS_DIR, fileName);
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsedAnalysis = parseAnalysisJson(content);
  const roughVideoId = inferVideoId(content, fileName, null);
  const roughIndex = inferIndex(content, fileName, null);
  const catalogEntry = catalogMaps.byVideoId.get(roughVideoId) || catalogMaps.byIndex.get(roughIndex) || null;

  const report = {
    fileName,
    filePath,
    index: inferIndex(content, fileName, catalogEntry),
    videoId: inferVideoId(content, fileName, catalogEntry),
    url: inferUrl(content, catalogEntry, roughVideoId),
    title: inferTitle(content, fileName, catalogEntry),
    processedAt: inferProcessedAt(content),
    summary: inferSummary(content, parsedAnalysis),
    keyPoints: inferKeyPoints(content, parsedAnalysis),
    aiConcepts: inferConcepts(content, parsedAnalysis),
    technicalDetails: inferTechnicalDetails(content, parsedAnalysis),
    reportType: fileName.split('_')[0],
    mtime: fs.statSync(filePath).mtime.toISOString()
  };

  return scoreReport(report, maxIndex);
}

function buildReports(catalogMaps) {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(fileName => fileName.endsWith('.md'))
    .sort();

  const maxIndex = catalogMaps.items.reduce((maxValue, item) => Math.max(maxValue, item.index || 0), 0);
  return files.map(fileName => parseReportFile(fileName, catalogMaps, maxIndex));
}

function buildInitiatives(relevantReports, maxIndex) {
  const initiatives = [];
  const initiativePool = relevantReports.filter(
    report => CATALOG_ORDER === 'newest-first'
      ? report.index <= Math.max(RECENT_WINDOW * 3, 180)
      : report.index >= Math.max(1, maxIndex - Math.max(RECENT_WINDOW * 3, 180))
  );
  const sourceReports = initiativePool.length > 0 ? initiativePool : relevantReports;

  for (const domain of DOMAIN_DEFINITIONS) {
    const domainReports = sourceReports
      .filter(report => report.primaryDomain?.id === domain.id)
      .sort((left, right) => right.priorityScore - left.priorityScore);

    if (domainReports.length === 0) {
      continue;
    }

    const topSources = domainReports.slice(0, 5).map(report => ({
      index: report.index,
      title: report.title,
      url: report.url,
      priorityScore: report.priorityScore,
      summary: truncate(report.summary || report.keyPoints[0] || '', 220)
    }));

    const leadSource = topSources[0];
    initiatives.push({
      id: domain.id,
      title: domain.initiativeTitle,
      domain: domain.label,
      status: 'queued',
      priorityScore: leadSource.priorityScore,
      whyNow: leadSource
        ? `Lead source #${leadSource.index} ranks highest for this domain and recent sources reinforce the same direction.`
        : 'Recent sources support this direction.',
      successMetric: domain.successMetric,
      actionPlan: domain.actionPlan,
      topSources
    });
  }

  return initiatives.sort((left, right) => right.priorityScore - left.priorityScore);
}

function buildRecentQueue(relevantReports, maxIndex) {
  const recentRelevant = relevantReports
    .filter(report => CATALOG_ORDER === 'newest-first'
      ? report.index <= RECENT_WINDOW
      : report.index >= Math.max(1, maxIndex - RECENT_WINDOW + 1))
    .sort((left, right) => right.priorityScore - left.priorityScore);

  const queue = (recentRelevant.length > 0 ? recentRelevant : relevantReports)
    .slice(0, TOP_LIMIT)
    .map((report, position) => {
      const domain = DOMAIN_DEFINITIONS.find(item => item.id === report.primaryDomain?.id);
      return {
        rank: position + 1,
        index: report.index,
        title: report.title,
        url: report.url,
        domain: report.primaryDomain?.label || 'General',
        score: report.priorityScore,
        whyItMatters: truncate(report.summary || report.keyPoints[0] || report.title, 220),
        firstAction: domain ? domain.quickMove : 'Review the source and decide whether it changes the current TNF roadmap.',
        sourceFile: report.fileName
      };
    });

  return queue;
}

function buildSprintTickets(queue, initiatives) {
  const initiativeByDomain = new Map(initiatives.map(item => [item.domain, item]));
  return queue.slice(0, 5).map((item, idx) => {
    const initiative = initiativeByDomain.get(item.domain);
    return {
      id: `tnf-sprint-${idx + 1}`,
      title: `${item.domain}: ${item.title}`,
      sourceIndex: item.index,
      sourceUrl: item.url,
      priority: idx + 1,
      domain: item.domain,
      objective: initiative?.title || `Operationalize insight from #${item.index}`,
      whyNow: item.whyItMatters,
      implementationSteps: initiative
        ? initiative.actionPlan
        : ['Review the source', 'Extract the implementation pattern', 'Test it locally inside TNF'],
      firstDeliverable: item.firstAction,
      status: 'queued'
    };
  });
}

function buildNextBatch(catalogItems, relevantReports, maxIndex) {
  const relevantByVideoId = new Map();
  const relevantByIndex = new Map();

  for (const report of relevantReports) {
    if (report.videoId) {
      relevantByVideoId.set(report.videoId, report);
    }
    if (report.index) {
      relevantByIndex.set(report.index, report);
    }
  }

  const recentItems = catalogItems
    .filter(item => CATALOG_ORDER === 'newest-first'
      ? item.index <= RECENT_WINDOW
      : item.index >= Math.max(1, maxIndex - RECENT_WINDOW + 1))
    .map(item => {
      const linkedReport = relevantByVideoId.get(item.videoId) || relevantByIndex.get(item.index) || null;
      const priority = !item.processed
        ? linkedReport
          ? 'process-now'
          : 'defer'
        : linkedReport
          ? 'review-now'
          : 'defer';

      return {
        index: item.index,
        title: item.title,
        url: item.url,
        processed: Boolean(item.processed),
        relevant: Boolean(linkedReport),
        priority,
        linkedDomain: linkedReport?.primaryDomain?.label || null,
        linkedScore: linkedReport?.priorityScore || 0
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    recentWindow: RECENT_WINDOW,
    processNow: recentItems.filter(item => item.priority === 'process-now'),
    reviewNow: recentItems
      .filter(item => item.priority === 'review-now')
      .sort((left, right) => right.linkedScore - left.linkedScore)
      .slice(0, TOP_LIMIT),
    deferForNow: recentItems.filter(item => item.priority === 'defer')
  };
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

function renderReadme(summary) {
  return [
    '# Action Intelligence',
    '',
    'Local-only intelligence artifacts generated from the private YouTube corpus.',
    '',
    '## Rules',
    '',
    '- Raw personal source material stays in the private knowledge base.',
    '- Newer sources outrank older sources by default when they cover the same operating domain.',
    '- Older sources remain useful as historical context until a newer pattern is locally validated.',
    '- Only derived implementation decisions should be considered for TNF SaaS exposure.',
    '',
    '## Files',
    '',
    '- `source-index.json` - structured index of scanned reports with relevance and priority scores.',
    '- `latest-priority-queue.md` - recent high-value sources to review first.',
    '- `implementation-ledger.json` - initiative-level action plan grouped by operating domain.',
    '- `implementation-ledger.md` - readable version of the initiative ledger.',
    '- `tnf-sprint.json` - top 5 TNF-ready implementation tickets from the freshest relevant sources.',
    '- `tnf-sprint.md` - readable TNF sprint backlog.',
    '- `next-batch.json` - recency window with `process-now`, `review-now`, and `defer` decisions.',
    '',
    '## Current Snapshot',
    '',
    `- Reports scanned: ${summary.totalReports}`,
    `- Relevant reports: ${summary.relevantReports}`,
    `- Recent window: last ${summary.recentWindow} catalog items`,
    `- Highest catalog index: ${summary.maxIndex}`,
    `- Catalog order: ${summary.catalogOrder}`,
    '',
    `Generated: ${summary.generatedAt}`,
    ''
  ].join('\n');
}

function renderPriorityQueue(queue, nextBatchSummary) {
  const lines = [
    '# Latest Priority Queue',
    '',
    'Recent high-value sources ranked for TNF orchestration, private intelligence, and monetizable offer building.',
    '',
    `Generated: ${new Date().toISOString()}`,
    ''
  ];

  if (queue.length === 0) {
    lines.push('No relevant sources were found in the current corpus.');
    return lines.join('\n');
  }

  for (const item of queue) {
    lines.push(`## ${item.rank}. #${item.index} - ${item.title}`);
    lines.push(`- Domain: ${item.domain}`);
    lines.push(`- Score: ${item.score}`);
    lines.push(`- Source: ${item.url}`);
    lines.push(`- Why it matters: ${item.whyItMatters}`);
    lines.push(`- First move: ${item.firstAction}`);
    lines.push(`- File: ${item.sourceFile}`);
    lines.push('');
  }

  lines.push('## Latest Batch Guidance');
  lines.push('');
  lines.push(`- Process now: ${nextBatchSummary.processNow.length}`);
  lines.push(`- Review now: ${nextBatchSummary.reviewNow.length}`);
  lines.push(`- Defer for now: ${nextBatchSummary.deferForNow.length}`);
  lines.push('');

  if (nextBatchSummary.processNow.length === 0) {
    lines.push('- Current unprocessed items in the recent window do not appear strategically aligned, so they can wait while we process the next relevant batch.');
  }

  return lines.join('\n');
}

function renderImplementationLedger(initiatives) {
  const lines = [
    '# Implementation Ledger',
    '',
    'Draft initiatives generated from the strongest operating domains in the private corpus.',
    ''
  ];

  for (const initiative of initiatives) {
    lines.push(`## ${initiative.title}`);
    lines.push(`- Domain: ${initiative.domain}`);
    lines.push(`- Status: ${initiative.status}`);
    lines.push(`- Priority score: ${initiative.priorityScore}`);
    lines.push(`- Why now: ${initiative.whyNow}`);
    lines.push(`- Success metric: ${initiative.successMetric}`);
    lines.push('- Action plan:');
    for (const step of initiative.actionPlan) {
      lines.push(`  - ${step}`);
    }
    lines.push('- Lead sources:');
    for (const source of initiative.topSources) {
      lines.push(`  - #${source.index} ${source.title} (${source.url})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function renderSprintTickets(tickets) {
  const lines = [
    '# TNF Sprint',
    '',
    'Top 5 implementation tickets generated from the freshest strategically relevant sources.',
    ''
  ];

  for (const ticket of tickets) {
    lines.push(`## ${ticket.priority}. ${ticket.title}`);
    lines.push(`- Objective: ${ticket.objective}`);
    lines.push(`- Source: #${ticket.sourceIndex} ${ticket.sourceUrl}`);
    lines.push(`- Why now: ${ticket.whyNow}`);
    lines.push(`- First deliverable: ${ticket.firstDeliverable}`);
    lines.push('- Steps:');
    for (const step of ticket.implementationSteps) {
      lines.push(`  - ${step}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(REPORTS_DIR)) {
    throw new Error(`Reports directory not found: ${REPORTS_DIR}`);
  }

  ensureDir(ACTION_DIR);

  const catalogMaps = loadCatalog();
  const reports = buildReports(catalogMaps);
  const relevantReports = reports
    .filter(report => report.isRelevant)
    .sort((left, right) => right.priorityScore - left.priorityScore);
  const maxIndex = catalogMaps.items.reduce((maxValue, item) => Math.max(maxValue, item.index || 0), 0);

  const recentQueue = buildRecentQueue(relevantReports, maxIndex);
  const initiatives = buildInitiatives(relevantReports, maxIndex);
  const sprintTickets = buildSprintTickets(recentQueue, initiatives);
  const nextBatch = buildNextBatch(catalogMaps.items, relevantReports, maxIndex);

  const sourceIndex = {
    generatedAt: new Date().toISOString(),
    totalReports: reports.length,
    relevantReports: relevantReports.length,
    recentWindow: RECENT_WINDOW,
    topLimit: TOP_LIMIT,
    reports: reports.map(report => ({
      index: report.index,
      title: report.title,
      url: report.url,
      fileName: report.fileName,
      videoId: report.videoId,
      processedAt: report.processedAt,
      mtime: report.mtime,
      reportType: report.reportType,
      isRelevant: report.isRelevant,
      priorityScore: report.priorityScore,
      primaryDomain: report.primaryDomain?.label || null,
      matchedDomains: report.matchedDomains.map(domain => ({
        label: domain.label,
        matchCount: domain.matchCount
      })),
      summary: truncate(report.summary, 220)
    }))
  };

  const summary = {
    generatedAt: new Date().toISOString(),
    totalReports: reports.length,
    relevantReports: relevantReports.length,
    recentWindow: RECENT_WINDOW,
    maxIndex,
    catalogOrder: CATALOG_ORDER
  };

  writeFile(path.join(ACTION_DIR, 'README.md'), renderReadme(summary));
  writeFile(path.join(ACTION_DIR, 'source-index.json'), JSON.stringify(sourceIndex, null, 2));
  writeFile(path.join(ACTION_DIR, 'latest-priority-queue.md'), renderPriorityQueue(recentQueue, nextBatch));
  writeFile(path.join(ACTION_DIR, 'implementation-ledger.json'), JSON.stringify(initiatives, null, 2));
  writeFile(path.join(ACTION_DIR, 'implementation-ledger.md'), renderImplementationLedger(initiatives));
  writeFile(path.join(ACTION_DIR, 'tnf-sprint.json'), JSON.stringify(sprintTickets, null, 2));
  writeFile(path.join(ACTION_DIR, 'tnf-sprint.md'), renderSprintTickets(sprintTickets));
  writeFile(path.join(ACTION_DIR, 'next-batch.json'), JSON.stringify(nextBatch, null, 2));

  console.log('✅ Action intelligence built');
  console.log(`   Output: ${ACTION_DIR}`);
  console.log(`   Reports scanned: ${reports.length}`);
  console.log(`   Relevant reports: ${relevantReports.length}`);
  console.log(`   Recent queue size: ${recentQueue.length}`);
  console.log(`   Initiatives: ${initiatives.length}`);
  console.log(`   Sprint tickets: ${sprintTickets.length}`);
  console.log(`   Process now: ${nextBatch.processNow.length}`);
  console.log(`   Review now: ${nextBatch.reviewNow.length}`);
}

main();
