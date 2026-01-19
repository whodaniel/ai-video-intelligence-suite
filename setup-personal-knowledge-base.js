#!/usr/bin/env node

/**
 * Personal Knowledge Base Setup Tool
 *
 * This tool:
 * 1. Creates a dedicated personal knowledge base repository
 * 2. Migrates existing personal data from various locations
 * 3. Sets up proper folder structure
 * 4. Initializes Git repository
 * 5. Updates application config to use personal data location
 * 6. Creates configuration files
 *
 * Usage: node setup-personal-knowledge-base.js [target-directory]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

const os = require('os');

// Default locations
const DEFAULT_LOCATIONS = {
  personalDataDir: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'my-ai-knowledge-base'),
  tnfDataDir: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'my-ai-knowledge-base', 'video-reports'),
  tnfLibrary: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'my-ai-knowledge-base', 'video-library', 'ai_video_library.html'),
  consolidatedKB: path.join(os.homedir(), 'Desktop', 'A1-Inter-LLM-Com', 'my-ai-knowledge-base', 'consolidated_ai_knowledge.md')
};

class PersonalKnowledgeBaseSetup {
  constructor(targetDir) {
    this.targetDir = targetDir || DEFAULT_LOCATIONS.personalDataDir;
    this.config = {};
  }

  async run() {
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║   Personal Knowledge Base Setup - AI Video Intelligence Suite    ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    try {
      // Step 1: Confirm target directory
      await this.confirmTargetDirectory();

      // Step 2: Create folder structure
      await this.createFolderStructure();

      // Step 3: Detect existing data
      const existingData = await this.detectExistingData();

      // Step 4: Migrate data
      if (existingData.found) {
        await this.migrateExistingData(existingData);
      }

      // Step 5: Initialize Git repository
      await this.initializeGitRepo();

      // Step 6: Create configuration files
      await this.createConfigFiles();

      // Step 7: Update application config
      await this.updateApplicationConfig();

      // Step 8: Create helper scripts
      await this.createHelperScripts();

      // Step 9: Display summary
      await this.displaySummary();

      console.log('\n✅ Setup complete!\n');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async confirmTargetDirectory() {
    console.log('📁 Step 1: Choose Personal Data Location\n');
    console.log(`   Default: ${this.targetDir}\n`);

    const useDefault = await question('   Use default location? (y/n): ');

    if (useDefault.toLowerCase() !== 'y') {
      this.targetDir = await question('   Enter custom path: ');
    }

    // Expand home directory
    this.targetDir = this.targetDir.replace('~', process.env.HOME);

    console.log(`\n   ✓ Target: ${this.targetDir}\n`);
  }

  async createFolderStructure() {
    console.log('📂 Step 2: Creating Folder Structure\n');

    const folders = [
      'video-library',
      'video-reports',
      'knowledge-base',
      'knowledge-base/topics',
      'knowledge-base/tools',
      'knowledge-base/concepts',
      'exports',
      'exports/notebooklm',
      'exports/podcasts',
      'exports/summaries',
      'processing-logs',
      'config'
    ];

    for (const folder of folders) {
      const fullPath = path.join(this.targetDir, folder);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   ✓ Created: ${folder}`);
      } else {
        console.log(`   ⏭  Exists: ${folder}`);
      }
    }

    console.log();
  }

  async detectExistingData() {
    console.log('🔍 Step 3: Detecting Existing Data\n');

    const data = {
      found: false,
      videoLibrary: null,
      reports: [],
      consolidatedKB: null
    };

    // Check for video library
    if (fs.existsSync(DEFAULT_LOCATIONS.tnfLibrary)) {
      data.videoLibrary = DEFAULT_LOCATIONS.tnfLibrary;
      console.log(`   ✓ Found video library: ${DEFAULT_LOCATIONS.tnfLibrary}`);
      data.found = true;
    }

    // Check for video reports
    if (fs.existsSync(DEFAULT_LOCATIONS.tnfDataDir)) {
      const files = fs.readdirSync(DEFAULT_LOCATIONS.tnfDataDir);
      const reports = files.filter(f => f.endsWith('.md'));
      if (reports.length > 0) {
        data.reports = reports.map(f => path.join(DEFAULT_LOCATIONS.tnfDataDir, f));
        console.log(`   ✓ Found ${reports.length} video reports`);
        data.found = true;
      }
    }

    // Check for consolidated knowledge base
    if (fs.existsSync(DEFAULT_LOCATIONS.consolidatedKB)) {
      data.consolidatedKB = DEFAULT_LOCATIONS.consolidatedKB;
      console.log(`   ✓ Found consolidated knowledge base`);
      data.found = true;
    }

    if (!data.found) {
      console.log('   ℹ  No existing data found (fresh start)');
    }

    console.log();
    return data;
  }

  async migrateExistingData(existingData) {
    console.log('📦 Step 4: Migrating Existing Data\n');

    const migrate = await question('   Migrate existing data? (y/n): ');

    if (migrate.toLowerCase() !== 'y') {
      console.log('   ⏭  Skipped migration\n');
      return;
    }

    // Migrate video library
    if (existingData.videoLibrary) {
      const dest = path.join(this.targetDir, 'video-library', 'ai_video_library.html');
      fs.copyFileSync(existingData.videoLibrary, dest);
      console.log(`   ✓ Copied video library`);
    }

    // Migrate reports
    if (existingData.reports.length > 0) {
      console.log(`   ⏳ Copying ${existingData.reports.length} reports...`);
      let copied = 0;
      for (const report of existingData.reports) {
        const filename = path.basename(report);
        const dest = path.join(this.targetDir, 'video-reports', filename);
        fs.copyFileSync(report, dest);
        copied++;
        if (copied % 100 === 0) {
          process.stdout.write(`\r   ⏳ Copied ${copied}/${existingData.reports.length} reports...`);
        }
      }
      console.log(`\r   ✓ Copied ${copied} reports                    `);
    }

    // Migrate consolidated knowledge base
    if (existingData.consolidatedKB) {
      const dest = path.join(this.targetDir, 'knowledge-base', 'consolidated_ai_knowledge.md');
      fs.copyFileSync(existingData.consolidatedKB, dest);
      console.log(`   ✓ Copied consolidated knowledge base`);
    }

    console.log();
  }

  async initializeGitRepo() {
    console.log('🔧 Step 5: Initializing Git Repository\n');

    try {
      // Check if already a git repo
      const isGitRepo = fs.existsSync(path.join(this.targetDir, '.git'));

      if (!isGitRepo) {
        execSync('git init', { cwd: this.targetDir, stdio: 'pipe' });
        console.log('   ✓ Initialized Git repository');

        // Create .gitignore
        const gitignore = `# API Keys and Credentials
*.key
api-keys.txt
credentials.json
youtube-token.json
.env
.env.local

# Temporary files
*.tmp
*.temp
.DS_Store

# Logs that may contain sensitive info
*.log

# Node modules (if any scripts added)
node_modules/
`;
        fs.writeFileSync(path.join(this.targetDir, '.gitignore'), gitignore);
        console.log('   ✓ Created .gitignore');

        // Create README
        const readme = this.generateReadme();
        fs.writeFileSync(path.join(this.targetDir, 'README.md'), readme);
        console.log('   ✓ Created README.md');

        // Initial commit
        execSync('git add .', { cwd: this.targetDir, stdio: 'pipe' });
        execSync('git commit -m "Initial commit: Personal AI Knowledge Base"', {
          cwd: this.targetDir,
          stdio: 'pipe'
        });
        console.log('   ✓ Created initial commit');

      } else {
        console.log('   ⏭  Git repository already exists');
      }
    } catch (error) {
      console.log(`   ⚠  Git initialization skipped: ${error.message}`);
    }

    console.log();
  }

  async createConfigFiles() {
    console.log('⚙️  Step 6: Creating Configuration Files\n');

    // Processing config
    const processingConfig = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-flash',
      maxConcurrent: 5,
      retryAttempts: 3,
      filterPolitical: true,
      personalDataPath: this.targetDir
    };

    const processingConfigPath = path.join(this.targetDir, 'config', 'processing-config.json');
    fs.writeFileSync(processingConfigPath, JSON.stringify(processingConfig, null, 2));
    console.log('   ✓ Created processing-config.json');

    // Preferences
    const preferences = {
      autoBackup: true,
      backupFrequency: 'weekly',
      exportFormats: ['markdown', 'json', 'urls'],
      notebooklmIntegration: true,
      knowledgeBaseEvolution: {
        enabled: true,
        maxAge: 365, // days
        replaceObsolete: true
      }
    };

    const preferencesPath = path.join(this.targetDir, 'config', 'preferences.json');
    fs.writeFileSync(preferencesPath, JSON.stringify(preferences, null, 2));
    console.log('   ✓ Created preferences.json');

    // Stats file
    const stats = {
      totalVideos: 0,
      processedVideos: 0,
      totalCost: 0,
      lastUpdated: new Date().toISOString(),
      initialized: new Date().toISOString()
    };

    const statsPath = path.join(this.targetDir, 'config', 'stats.json');
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
    console.log('   ✓ Created stats.json');

    this.config = { processingConfig, preferences, stats };
    console.log();
  }

  async updateApplicationConfig() {
    console.log('🔗 Step 7: Updating Application Configuration\n');

    const appConfigPath = path.join(__dirname, 'config.json');

    let appConfig = {};
    if (fs.existsSync(appConfigPath)) {
      appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf-8'));
    }

    appConfig.personalDataPath = this.targetDir;
    appConfig.lastSetup = new Date().toISOString();

    fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
    console.log(`   ✓ Updated ${appConfigPath}`);
    console.log(`   ✓ Personal data path set to: ${this.targetDir}\n`);
  }

  async createHelperScripts() {
    console.log('📝 Step 8: Creating Helper Scripts\n');

    // Quick stats script
    const statsScript = `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baseDir = '${this.targetDir}';
const statsFile = path.join(baseDir, 'config', 'stats.json');

// Count videos
const libraryFile = path.join(baseDir, 'video-library', 'ai_video_library.html');
let totalVideos = 0;
if (fs.existsSync(libraryFile)) {
  const content = fs.readFileSync(libraryFile, 'utf-8');
  const matches = content.match(/<tr>/g);
  totalVideos = matches ? matches.length - 1 : 0; // -1 for header
}

// Count reports
const reportsDir = path.join(baseDir, 'video-reports');
let processedVideos = 0;
if (fs.existsSync(reportsDir)) {
  const files = fs.readdirSync(reportsDir);
  processedVideos = files.filter(f => f.endsWith('.md')).length;
}

// Update stats
const stats = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
stats.totalVideos = totalVideos;
stats.processedVideos = processedVideos;
stats.lastUpdated = new Date().toISOString();
fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));

console.log('📊 Personal Knowledge Base Stats');
console.log('================================');
console.log(\`Total Videos:     \${totalVideos}\`);
console.log(\`Processed:        \${processedVideos} (\${(processedVideos/totalVideos*100).toFixed(1)}%)\`);
console.log(\`Unprocessed:      \${totalVideos - processedVideos}\`);
console.log(\`Total Cost:       $\${stats.totalCost.toFixed(2)}\`);
console.log(\`Last Updated:     \${stats.lastUpdated}\`);
`;

    const statsScriptPath = path.join(this.targetDir, 'quick-stats.js');
    fs.writeFileSync(statsScriptPath, statsScript);
    fs.chmodSync(statsScriptPath, '755');
    console.log('   ✓ Created quick-stats.js');

    // Backup script
    const backupScript = `#!/bin/bash
# Backup Personal Knowledge Base
BACKUP_DIR="${this.targetDir}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/knowledge-base-$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"
cd "${this.targetDir}"
tar -czf "$BACKUP_FILE" \\
  --exclude='backups' \\
  --exclude='.git' \\
  --exclude='node_modules' \\
  .

echo "✅ Backup created: $BACKUP_FILE"
echo "📦 Size: $(du -h "$BACKUP_FILE" | cut -f1)"
`;

    const backupScriptPath = path.join(this.targetDir, 'backup.sh');
    fs.writeFileSync(backupScriptPath, backupScript);
    fs.chmodSync(backupScriptPath, '755');
    console.log('   ✓ Created backup.sh');

    console.log();
  }

  generateReadme() {
    return `# My AI Knowledge Base

**Personal AI Knowledge Repository**

This is a private repository containing my personal AI learning materials, video analyses, and evolving knowledge base.

⚠️ **PRIVATE REPOSITORY** - Do not make public

---

## Setup

Initialized: ${new Date().toISOString()}
Location: ${this.targetDir}
Managed by: AI Video Intelligence Suite

---

## Structure

\`\`\`
my-ai-knowledge-base/
├── video-library/          # Video catalog and queue
├── video-reports/          # AI-analyzed reports
├── knowledge-base/         # Consolidated knowledge
├── exports/                # Export files
├── processing-logs/        # Processing history
└── config/                 # Configuration files
\`\`\`

---

## Quick Commands

\`\`\`bash
# View stats
./quick-stats.js

# Create backup
./backup.sh

# Update from application
# (Run processing from AI Video Intelligence Suite)
\`\`\`

---

## Privacy

- ✅ Private repository
- ✅ Local-only data
- ✅ No sensitive data in public repos
- ✅ API keys stored separately

---

*Generated by AI Video Intelligence Suite*
*https://github.com/whodaniel/ai-video-intelligence-suite*
`;
  }

  async displaySummary() {
    console.log('═'.repeat(70));
    console.log('\n📊 Setup Summary\n');
    console.log('═'.repeat(70));
    console.log();
    console.log('✅ Personal Knowledge Base Created');
    console.log(`   Location: ${this.targetDir}\n`);

    console.log('📁 Folder Structure:');
    console.log('   ├── video-library/');
    console.log('   ├── video-reports/');
    console.log('   ├── knowledge-base/');
    console.log('   ├── exports/');
    console.log('   ├── processing-logs/');
    console.log('   └── config/\n');

    console.log('🔧 Configuration Files:');
    console.log('   ├── config/processing-config.json');
    console.log('   ├── config/preferences.json');
    console.log('   └── config/stats.json\n');

    console.log('📝 Helper Scripts:');
    console.log('   ├── quick-stats.js      - View statistics');
    console.log('   └── backup.sh           - Create backup\n');

    console.log('🔗 Application Updated:');
    console.log('   - AI Video Intelligence Suite now uses this location');
    console.log('   - All future processing will use this directory\n');

    console.log('═'.repeat(70));
    console.log('\n🚀 Next Steps:\n');
    console.log('1. Review configuration: cat config/processing-config.json');
    console.log('2. Check stats: ./quick-stats.js');
    console.log('3. Create GitHub repo:');
    console.log('   cd', this.targetDir);
    console.log('   gh repo create my-ai-knowledge-base --private --source=.');
    console.log('   git push -u origin main');
    console.log('4. Start processing videos with AI Video Intelligence Suite\n');
  }
}

// Main execution
async function main() {
  const targetDir = process.argv[2];
  const setup = new PersonalKnowledgeBaseSetup(targetDir);
  await setup.run();
}

main().catch(console.error);
