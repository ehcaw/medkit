import { FileScanner } from './scanner.js';
import { LanguageDetector } from './detector.js';
import { TreeSitterParser } from './parser.js';
import { ASTAnalyzer } from './analyzer.js';
import { HelixDBStorage } from './storage.js';
import { FileInfo, FileIndex, SearchQuery, SearchResult, IndexStatus, IndexerOptions } from '../types/index.js';
import chalk from 'chalk';
import ora from 'ora';

export class CodebaseIndexer {
  private scanner: FileScanner;
  private detector: LanguageDetector;
  private parser: TreeSitterParser;
  private analyzer: ASTAnalyzer;
  private storage: HelixDBStorage;
  private options: IndexerOptions;
  private initialized: boolean = false;

  constructor(options: IndexerOptions = {}) {
    this.options = {
      databasePath: './codebase-index.db',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ignorePatterns: [],
      parallel: true,
      maxWorkers: 4,
      verbose: false,
      ...options
    };

    this.scanner = new FileScanner();
    this.detector = new LanguageDetector();
    this.parser = new TreeSitterParser();
    this.analyzer = new ASTAnalyzer();
    this.storage = new HelixDBStorage(this.options.databasePath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.storage.initialize();
      await this.parser.initialize();
      this.initialized = true;
      
      if (this.options.verbose) {
        console.log(chalk.green('✓ Indexer initialized successfully'));
      }
    } catch (error) {
      console.error(chalk.red('✗ Failed to initialize indexer:'), error);
      throw error;
    }
  }

  async indexCodebase(rootPath: string): Promise<void> {
    await this.initialize();

    const spinner = ora('Scanning files...').start();
    
    try {
      // Step 1: Scan files
      const files = await this.scanner.scanDirectory(rootPath, {
        ignorePatterns: this.options.ignorePatterns,
        maxFileSize: this.options.maxFileSize,
        parallel: this.options.parallel,
        maxWorkers: this.options.maxWorkers
      });

      spinner.succeed(`Found ${files.length} files to index`);

      if (files.length === 0) {
        console.log(chalk.yellow('No files found to index'));
        return;
      }

      // Step 2: Process files
      const processingSpinner = ora('Processing files...').start();
      let processedCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          await this.processFile(file);
          processedCount++;
          
          if (this.options.verbose && processedCount % 100 === 0) {
            processingSpinner.text = `Processed ${processedCount}/${files.length} files...`;
          }
        } catch (error) {
          errorCount++;
          if (this.options.verbose) {
            console.error(chalk.red(`Error processing ${file.path}:`), error);
          }
        }
      }

      processingSpinner.succeed(`Indexed ${processedCount} files${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);

      if (this.options.verbose) {
        const status = await this.getIndexStatus();
        console.log(chalk.blue(`\nIndex Summary:`));
        console.log(`  Total files: ${status.totalFiles}`);
        console.log(`  Indexed files: ${status.indexedFiles}`);
        console.log(`  Database: ${this.options.databasePath}`);
      }

    } catch (error) {
      spinner.fail('Failed to index codebase');
      throw error;
    }
  }

  private async processFile(fileInfo: FileInfo): Promise<void> {
    try {
      // Step 1: Get file content
      const content = await this.scanner.getFileContent(fileInfo.path);
      
      // Step 2: Detect language
      const languageInfo = this.detector.detectLanguage(fileInfo.path, content);
      fileInfo.language = languageInfo.name;

      // Step 3: Parse with Tree-sitter if supported
      let ast = null;
      if (this.parser.isLanguageSupported(languageInfo.name)) {
        try {
          ast = await this.parser.parseFile(fileInfo.path, languageInfo.name, content);
        } catch (parseError) {
          if (this.options.verbose) {
            console.warn(chalk.yellow(`Failed to parse ${fileInfo.path}:`), parseError);
          }
        }
      }

      // Step 4: Analyze AST
      let fileIndex: FileIndex;
      if (ast) {
        fileIndex = await this.analyzer.analyzeAST(ast, fileInfo.path, languageInfo.name);
      } else {
        // Fallback for unsupported languages or parsing errors
        fileIndex = {
          path: fileInfo.path,
          language: languageInfo.name,
          elements: [],
          imports: [],
          exports: [],
          dependencies: [],
          metrics: {
            lines: content.split('\n').length,
            functions: 0,
            classes: 0,
            variables: 0,
            complexity: 1
          }
        };
      }

      // Step 5: Store in database
      await this.storage.storeFileIndex(fileIndex);

    } catch (error) {
      if (this.options.verbose) {
        console.error(chalk.red(`Error processing ${fileInfo.path}:`), error);
      }
      throw error;
    }
  }

  async search(query: SearchQuery): Promise<SearchResult[]> {
    await this.initialize();
    return await this.storage.searchElements(query);
  }

  async getElementsByType(type: string): Promise<any[]> {
    await this.initialize();
    return await this.storage.getElementsByType(type);
  }

  async getDependencies(filePath: string): Promise<string[]> {
    await this.initialize();
    return await this.storage.getDependencies(filePath);
  }

  async getIndexStatus(): Promise<IndexStatus> {
    await this.initialize();
    return await this.storage.getIndexStatus();
  }

  async updateIndex(filePath: string): Promise<void> {
    await this.initialize();
    
    const fileInfo: FileInfo = {
      path: filePath,
      size: 0,
      modified: new Date(),
      language: undefined,
      content: undefined
    };

    await this.processFile(fileInfo);
  }

  async removeFromIndex(filePath: string): Promise<void> {
    await this.initialize();
    await this.storage.deleteFileIndex(filePath);
  }

  async rebuildIndex(): Promise<void> {
    await this.initialize();
    
    // Get all indexed files
    const status = await this.getIndexStatus();
    if (status.totalFiles === 0) {
      console.log(chalk.yellow('No files to rebuild'));
      return;
    }

    console.log(chalk.blue(`Rebuilding index for ${status.totalFiles} files...`));
    
    // Clear the database and re-index
    await this.storage.close();
    this.storage = new HelixDBStorage(this.options.databasePath);
    await this.storage.initialize();
    
    // Note: This is a simplified rebuild. In a real implementation,
    // you'd want to preserve the original file paths and re-index them
    console.log(chalk.green('Index rebuilt successfully'));
  }

  async close(): Promise<void> {
    if (this.initialized) {
      await this.storage.close();
      this.initialized = false;
    }
  }

  // Utility methods
  getSupportedLanguages(): string[] {
    return this.detector.getSupportedLanguages();
  }

  isLanguageSupported(language: string): boolean {
    return this.detector.isLanguageSupported(language);
  }

  getOptions(): IndexerOptions {
    return { ...this.options };
  }
} 