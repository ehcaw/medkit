#!/usr/bin/env node

import { Command } from 'commander';
import { CodebaseIndexer } from './core/indexer.js';
import { IndexerOptions } from './types/index.js';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('codebase-indexer')
  .description('High-performance codebase indexer using Tree-sitter and SQLite')
  .version('0.1.0');

program
  .command('index')
  .description('Index a codebase')
  .argument('<path>', 'Path to the codebase to index')
  .option('-d, --database <path>', 'Database file path', './codebase-index.db')
  .option('-m, --max-size <size>', 'Maximum file size in MB', '10')
  .option('-i, --ignore <patterns>', 'Ignore patterns (comma-separated)')
  .option('-p, --parallel', 'Enable parallel processing', false)
  .option('-w, --workers <count>', 'Number of worker threads', '4')
  .option('-v, --verbose', 'Enable verbose output', false)
  .action(async (path: string, options: any) => {
    const spinner = ora('Initializing indexer...').start();
    
    try {
      const indexerOptions: IndexerOptions = {
        databasePath: options.database,
        maxFileSize: parseInt(options.maxSize) * 1024 * 1024,
        ignorePatterns: options.ignore ? options.ignore.split(',') : undefined,
        parallel: options.parallel,
        maxWorkers: parseInt(options.workers),
        verbose: options.verbose
      };

      const indexer = new CodebaseIndexer(indexerOptions);
      
      spinner.text = 'Indexing codebase...';
      await indexer.indexCodebase(path);
      
      spinner.succeed('Codebase indexed successfully!');
      
      const status = await indexer.getIndexStatus();
      console.log(chalk.green(`\nIndexed ${status.indexedFiles} files`));
      console.log(chalk.blue(`Database: ${options.database}`));
      
    } catch (error) {
      spinner.fail('Failed to index codebase');
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('search')
  .description('Search indexed codebase')
  .argument('<query>', 'Search query')
  .option('-t, --type <type>', 'Filter by element type')
  .option('-l, --language <language>', 'Filter by programming language')
  .option('-f, --file <path>', 'Filter by file path')
  .option('-d, --database <path>', 'Database file path', './codebase-index.db')
  .action(async (query: string, options: any) => {
    try {
      const indexer = new CodebaseIndexer({ databasePath: options.database });
      await indexer.initialize();
      
      const results = await indexer.search({
        text: query,
        type: options.type,
        language: options.language,
        filePath: options.file
      });
      
      if (results.length === 0) {
        console.log(chalk.yellow('No results found'));
        return;
      }
      
      console.log(chalk.green(`Found ${results.length} results:\n`));
      
      for (const result of results) {
        const element = result.element;
        console.log(chalk.cyan(`${element.name} (${element.type})`));
        console.log(chalk.gray(`  ${element.path}:${element.line}:${element.column}`));
        if (element.signature) {
          console.log(chalk.gray(`  ${element.signature}`));
        }
        if (element.documentation) {
          console.log(chalk.gray(`  ${element.documentation}`));
        }
        console.log('');
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Show indexing status')
  .option('-d, --database <path>', 'Database file path', './codebase-index.db')
  .action(async (options: any) => {
    try {
      const indexer = new CodebaseIndexer({ databasePath: options.database });
      await indexer.initialize();
      
      const status = await indexer.getIndexStatus();
      
      console.log(chalk.blue('Index Status:'));
      console.log(`  Total files: ${status.totalFiles}`);
      console.log(`  Indexed files: ${status.indexedFiles}`);
      console.log(`  Last indexed: ${status.lastIndexed.toLocaleString()}`);
      console.log(`  Status: ${status.isComplete ? chalk.green('Complete') : chalk.yellow('Incomplete')}`);
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List indexed elements')
  .option('-t, --type <type>', 'Filter by element type')
  .option('-l, --language <language>', 'Filter by programming language')
  .option('-d, --database <path>', 'Database file path', './codebase-index.db')
  .action(async (options: any) => {
    try {
      const indexer = new CodebaseIndexer({ databasePath: options.database });
      await indexer.initialize();
      
      const elements = await indexer.getElementsByType(options.type || 'function');
      
      if (elements.length === 0) {
        console.log(chalk.yellow('No elements found'));
        return;
      }
      
      console.log(chalk.green(`Found ${elements.length} elements:\n`));
      
      for (const element of elements) {
        console.log(chalk.cyan(`${element.name} (${element.type})`));
        console.log(chalk.gray(`  ${element.path}:${element.line}:${element.column}`));
        if (element.signature) {
          console.log(chalk.gray(`  ${element.signature}`));
        }
        console.log('');
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse(); 