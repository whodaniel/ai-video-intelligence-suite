const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..');

function resolveConfigPath(value) {
  if (!value) {
    return value;
  }
  return path.isAbsolute(value) ? value : path.resolve(APP_ROOT, value);
}

function normalizeConfig(rawConfig) {
  const config = { ...rawConfig };
  const personalDataPath = config.personalDataPath || config.personalDataDir;

  if (personalDataPath) {
    const resolvedBase = resolveConfigPath(personalDataPath);

    config.personalDataPath = resolvedBase;
    config.personalDataDir = resolvedBase;
    config.reportsDir = resolveConfigPath(
      config.reportsDir || path.join(resolvedBase, 'video-reports')
    );
    config.transcriptsDir = resolveConfigPath(
      config.transcriptsDir || path.join(resolvedBase, 'transcripts')
    );
    config.libraryFile = resolveConfigPath(
      config.libraryFile || path.join(resolvedBase, 'video-library', 'ai_video_library.html')
    );
    config.consolidatedKB = resolveConfigPath(
      config.consolidatedKB || path.join(resolvedBase, 'knowledge-base', 'consolidated_ai_knowledge.md')
    );
    return config;
  }

  for (const key of ['reportsDir', 'transcriptsDir', 'libraryFile', 'consolidatedKB']) {
    config[key] = resolveConfigPath(config[key]);
  }

  return config;
}

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  const exampleConfigPath = path.join(__dirname, '..', 'config.example.json');

  if (fs.existsSync(configPath)) {
    return normalizeConfig(JSON.parse(fs.readFileSync(configPath, 'utf-8')));
  }

  console.warn('⚠️  config.json not found, using default paths from config.example.json');
  if (fs.existsSync(exampleConfigPath)) {
    return normalizeConfig(JSON.parse(fs.readFileSync(exampleConfigPath, 'utf-8')));
  }

  throw new Error('Configuration file not found. Please copy config.example.json to config.json and configure your paths.');
}

module.exports = loadConfig();
