#!/usr/bin/env node

import { Command } from 'commander';
import { VulnerabilityScanner } from './services/VulnerabilityScanner.js';
import { ScanOptions } from './models/index.js';
import chalk from 'chalk';
import ora from 'ora';
import { readFile } from 'fs/promises';

const program = new Command();

program
  .name('medkit')
  .description('AI-powered vulnerability detection and prompt optimization for frontend code')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan code for vulnerabilities and performance issues')
  .argument('<input>', 'File path, URL, or code string to scan')
  .option('-t, --type <type>', 'Input type: file, url, or code', 'file')
  .option('-l, --language <language>', 'Programming language for code input', 'javascript')
  .option('-s, --security', 'Include security analysis', true)
  .option('-p, --performance', 'Include performance analysis', true)
  .option('-r, --react-scan', 'Include React-specific analysis', false)
  .option('-g, --generate-prompts', 'Generate LLM prompts for findings', false)
  .option('-d, --generate-docs', 'Generate documentation suggestions', false)
  .option('-m, --model <model>', 'LLM model for prompts: gpt-4, claude, generic', 'generic')
  .option('-o, --output <format>', 'Output format: json, markdown, html', 'json')
  .option('--max-size <size>', 'Maximum file size in MB', '10')
  .option('--ignore <patterns>', 'Ignore patterns (comma-separated)')
  .option('--custom-rules <rules>', 'Custom rules file path')
  .option('-v, --verbose', 'Enable verbose output', false)
  .action(async (input: string, options: any) => {
    const spinner = ora('Initializing scanner...').start();
    
    try {
      const scanner = new VulnerabilityScanner();
      
      const scanOptions: ScanOptions = {
        includeSecurity: options.security,
        includePerformance: options.performance,
        includeReactScan: options.reactScan,
        maxFileSize: parseInt(options.maxSize) * 1024 * 1024,
        ignorePatterns: options.ignore ? options.ignore.split(',') : undefined,
        customRules: options.customRules ? await loadCustomRules(options.customRules) : undefined,
        llmModel: options.model,
        generatePrompts: options.generatePrompts,
        generateDocumentation: options.generateDocs,
        exportFormat: options.output
      };

      spinner.text = 'Scanning code...';
      
      let result;
      switch (options.type) {
        case 'file':
          result = await scanner.scanFile(input, scanOptions);
          break;
        case 'url':
          result = await scanner.scanURL(input, scanOptions);
          break;
        case 'code':
          result = await scanner.scanCodeString(input, options.language, scanOptions);
          break;
        default:
          throw new Error(`Unsupported input type: ${options.type}`);
      }

      spinner.succeed('Scan completed successfully!');

      // Display results
      displayResults(result, options);

    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('rules')
  .description('List available analysis rules')
  .option('-e, --enabled', 'Show only enabled rules', false)
  .option('-c, --category <category>', 'Filter by category: security, performance', undefined)
  .action(async (options: any) => {
    try {
      const scanner = new VulnerabilityScanner();
      
      if (options.enabled) {
        const enabledRules = scanner.getEnabledRules();
        console.log(chalk.green('Enabled Rules:'));
        enabledRules.forEach(ruleId => {
          console.log(`  - ${ruleId}`);
        });
      } else {
        console.log(chalk.blue('Available Rules:'));
        console.log(chalk.yellow('\nSecurity Rules:'));
        console.log('  SEC001 - Cross-Site Scripting (XSS)');
        console.log('  SEC002 - SQL Injection');
        console.log('  SEC003 - Command Injection');
        console.log('  SEC004 - Hardcoded Secrets');
        console.log('  SEC005 - Insecure Random Number Generation');
        console.log('  SEC006 - Missing CSRF Protection');
        
        console.log(chalk.yellow('\nPerformance Rules:'));
        console.log('  PERF001 - Unnecessary React Re-renders');
        console.log('  PERF002 - Large Bundle Size Indicators');
        console.log('  PERF003 - Potential Memory Leaks');
        console.log('  PERF004 - Expensive Operations in Render');
        console.log('  PERF005 - Missing Memoization');
        console.log('  PERF006 - Inefficient CSS Selectors');
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('enable')
  .description('Enable a specific analysis rule')
  .argument('<rule-id>', 'Rule ID to enable')
  .action(async (ruleId: string) => {
    try {
      const scanner = new VulnerabilityScanner();
      scanner.enableRule(ruleId);
      console.log(chalk.green(`✓ Rule ${ruleId} enabled`));
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('disable')
  .description('Disable a specific analysis rule')
  .argument('<rule-id>', 'Rule ID to disable')
  .action(async (ruleId: string) => {
    try {
      const scanner = new VulnerabilityScanner();
      scanner.disableRule(ruleId);
      console.log(chalk.yellow(`✓ Rule ${ruleId} disabled`));
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('languages')
  .description('List supported programming languages')
  .action(async () => {
    try {
      const scanner = new VulnerabilityScanner();
      const languages = scanner.getSupportedLanguages();
      
      console.log(chalk.blue('Supported Languages:'));
      languages.forEach(lang => {
        console.log(`  - ${lang}`);
      });
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function loadCustomRules(filePath: string): Promise<string[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.split('\n').filter(line => line.trim().length > 0);
  } catch (error) {
    throw new Error(`Failed to load custom rules from ${filePath}: ${error}`);
  }
}

function displayResults(result: any, options: any): void {
  if (options.output === 'json') {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Display summary
  console.log(chalk.blue('\n=== Scan Summary ==='));
  console.log(`Status: ${result.status === 'completed' ? chalk.green('✓ Completed') : chalk.red('✗ Failed')}`);
  console.log(`Total Findings: ${result.summary.totalFindings}`);
  console.log(`Security Issues: ${result.summary.securityFindings}`);
  console.log(`Performance Issues: ${result.summary.performanceFindings}`);
  console.log(`Scan Duration: ${result.summary.scanDuration}ms`);

  if (result.status === 'failed') {
    console.log(chalk.red(`Error: ${result.error}`));
    return;
  }

  // Display findings by severity
  if (result.summary.criticalCount > 0) {
    console.log(chalk.red(`\nCritical Issues: ${result.summary.criticalCount}`));
  }
  if (result.summary.highCount > 0) {
    console.log(chalk.magenta(`High Issues: ${result.summary.highCount}`));
  }
  if (result.summary.mediumCount > 0) {
    console.log(chalk.yellow(`Medium Issues: ${result.summary.mediumCount}`));
  }
  if (result.summary.lowCount > 0) {
    console.log(chalk.blue(`Low Issues: ${result.summary.lowCount}`));
  }

  // Display detailed findings
  if (result.findings.length > 0) {
    console.log(chalk.blue('\n=== Detailed Findings ==='));
    
    result.findings.forEach((finding: any, index: number) => {
      const severityColor = {
        critical: chalk.red,
        high: chalk.magenta,
        medium: chalk.yellow,
        low: chalk.blue
      }[finding.severity] || chalk.white;

      console.log(`\n${index + 1}. ${severityColor(finding.title)} (${finding.severity.toUpperCase()})`);
      console.log(`   Type: ${finding.type}`);
      console.log(`   File: ${finding.location.file}:${finding.location.startLine}`);
      console.log(`   Description: ${finding.description}`);
      console.log(`   Recommendation: ${finding.recommendation}`);
      
      if (finding.cweId) {
        console.log(`   CWE: ${finding.cweId}`);
      }
      if (finding.owaspCategory) {
        console.log(`   OWASP: ${finding.owaspCategory}`);
      }
    });
  }

  // Display prompts if generated
  if (result.prompts && result.prompts.length > 0) {
    console.log(chalk.blue('\n=== Generated Prompts ==='));
    result.prompts.forEach((prompt: any, index: number) => {
      console.log(`\n${index + 1}. Prompt for ${prompt.context.issue}`);
      console.log(`   Model: ${prompt.model}`);
      console.log(`   Priority: ${prompt.priority}`);
      console.log(`   Prompt: ${prompt.prompt.substring(0, 200)}...`);
    });
  }

  // Display documentation suggestions if generated
  if (result.documentation && result.documentation.length > 0) {
    console.log(chalk.blue('\n=== Documentation Suggestions ==='));
    result.documentation.forEach((suggestion: any, index: number) => {
      console.log(`\n${index + 1}. ${suggestion.suggestion}`);
      console.log(`   Type: ${suggestion.type}`);
      console.log(`   Target: ${suggestion.target}`);
      console.log(`   Priority: ${suggestion.priority}`);
    });
  }

  // Display metadata
  if (options.verbose) {
    console.log(chalk.blue('\n=== Metadata ==='));
    console.log(`Files Scanned: ${result.metadata.files.join(', ')}`);
    console.log(`Languages: ${result.metadata.languages.join(', ')}`);
    console.log(`Frameworks: ${result.metadata.frameworks.join(', ')}`);
    console.log(`Dependencies: ${result.metadata.dependencies.length}`);
    console.log(`Total Size: ${result.metadata.totalSize} bytes`);
  }
}

program.parse(); 