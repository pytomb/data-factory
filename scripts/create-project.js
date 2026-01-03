#!/usr/bin/env node

/**
 * Data Factory - Project Creation Script
 *
 * Creates a new Data Factory project from the template.
 *
 * Usage:
 *   node scripts/create-project.js <project-name>
 *   node scripts/create-project.js ellembelle-education
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  console.log('\n' + '═'.repeat(60));
  log(`  ${title}`, 'cyan');
  console.log('═'.repeat(60) + '\n');
}

/**
 * Replace template variables in content
 */
function replaceVariables(content, variables) {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Copy directory recursively with variable replacement
 */
function copyTemplate(srcDir, destDir, variables) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyTemplate(srcPath, destPath, variables);
    } else if (entry.name !== '.gitkeep-dirs') {
      let content = fs.readFileSync(srcPath, 'utf-8');
      content = replaceVariables(content, variables);
      fs.writeFileSync(destPath, content);
      log(`  Created: ${path.relative(destDir, destPath)}`, 'green');
    }
  }
}

/**
 * Create directory structure from .gitkeep-dirs file
 */
function createDirectories(projectDir, templateDir) {
  const gitkeepPath = path.join(templateDir, '.gitkeep-dirs');

  if (!fs.existsSync(gitkeepPath)) return;

  const content = fs.readFileSync(gitkeepPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const dirPath = path.join(projectDir, trimmed);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      // Create .gitkeep file
      fs.writeFileSync(path.join(dirPath, '.gitkeep'), '');
      log(`  Created: ${trimmed}`, 'blue');
    }
  }
}

/**
 * Main project creation function
 */
function createProject(projectName, options = {}) {
  logHeader('Data Factory - Project Creation');

  // Validate project name
  if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
    log('Error: Project name can only contain letters, numbers, hyphens, and underscores', 'red');
    process.exit(1);
  }

  // Determine paths
  const factoryRoot = path.resolve(__dirname, '..');
  const templateDir = path.join(factoryRoot, 'factory', 'templates', 'project-template');
  const projectsDir = options.outputDir || path.join(factoryRoot, 'projects');
  const projectDir = path.join(projectsDir, projectName);

  log(`  Factory root: ${factoryRoot}`, 'blue');
  log(`  Template: ${templateDir}`, 'blue');
  log(`  New project: ${projectDir}`, 'blue');
  console.log('');

  // Check if project already exists
  if (fs.existsSync(projectDir)) {
    log(`Error: Project "${projectName}" already exists at ${projectDir}`, 'red');
    process.exit(1);
  }

  // Check if template exists
  if (!fs.existsSync(templateDir)) {
    log(`Error: Template not found at ${templateDir}`, 'red');
    process.exit(1);
  }

  // Prepare variables
  const now = new Date().toISOString();
  const variables = {
    PROJECT_NAME: projectName,
    DISPLAY_NAME: options.displayName || projectName.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    DOMAIN_NAME: options.domain || 'undefined',
    CREATED_AT: now,
  };

  log(`  Project name: ${variables.PROJECT_NAME}`, 'blue');
  log(`  Display name: ${variables.DISPLAY_NAME}`, 'blue');
  log(`  Domain: ${variables.DOMAIN_NAME}`, 'blue');
  console.log('');

  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });
  log('Creating project structure...', 'cyan');

  // Create directories from .gitkeep-dirs
  createDirectories(projectDir, templateDir);

  // Copy template files
  log('\nCopying template files...', 'cyan');
  copyTemplate(templateDir, projectDir, variables);

  // Summary
  logHeader('Project Created Successfully');

  log(`  Location: ${projectDir}`, 'green');
  console.log('');
  log('Next steps:', 'cyan');
  log('  1. Edit docs/domain-brief.md to define your domain', 'yellow');
  log('  2. Edit docs/data-sources.md to identify data sources', 'yellow');
  log('  3. Edit docs/data-governance.md for ethics review', 'yellow');
  log('  4. Run: /forge to start the workflow', 'yellow');
  console.log('');

  return projectDir;
}

// Parse command line arguments
function parseArgs(args) {
  const options = {};
  let projectName = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--display-name' && args[i + 1]) {
      options.displayName = args[++i];
    } else if (args[i] === '--domain' && args[i + 1]) {
      options.domain = args[++i];
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputDir = args[++i];
    } else if (!args[i].startsWith('--')) {
      projectName = args[i];
    }
  }

  return { projectName, options };
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node scripts/create-project.js <project-name> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --display-name <name>  Human-readable project name');
    console.log('  --domain <domain>      Domain name (e.g., education, healthcare)');
    console.log('  --output <dir>         Output directory (default: projects/)');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/create-project.js ellembelle-education');
    console.log('  node scripts/create-project.js ellembelle-education --domain education');
    console.log('  node scripts/create-project.js my-project --display-name "My ML Project"');
    process.exit(0);
  }

  const { projectName, options } = parseArgs(args);

  if (!projectName) {
    log('Error: Project name required', 'red');
    process.exit(1);
  }

  createProject(projectName, options);
}

module.exports = { createProject };
