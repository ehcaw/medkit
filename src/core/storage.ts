import { FileIndex, CodeElement, SearchQuery, SearchResult, IndexStatus } from '../types/index.js';
import { createHash } from 'crypto';

export class HelixDBStorage {
  private dbPath: string;
  private files: Map<string, FileIndex> = new Map();
  private elements: Map<string, CodeElement[]> = new Map();
  private initialized: boolean = false;

  constructor(dbPath: string = './codebase-index.db') {
    this.dbPath = dbPath;
  }

  async initialize(): Promise<void> {
    try {
      this.initialized = true;
      console.log('Database initialized successfully (in-memory mode)');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async storeFileIndex(fileIndex: FileIndex): Promise<void> {
    if (!this.initialized) throw new Error('Database not initialized');

    const contentHash = this.calculateContentHash(fileIndex);
    
    // Store file index
    this.files.set(fileIndex.path, {
      ...fileIndex,
      metrics: {
        ...fileIndex.metrics,
        lines: fileIndex.metrics.lines || 0
      }
    });

    // Store elements
    this.elements.set(fileIndex.path, fileIndex.elements);
  }

  async updateFileIndex(fileIndex: FileIndex): Promise<void> {
    await this.storeFileIndex(fileIndex);
  }

  async deleteFileIndex(filePath: string): Promise<void> {
    if (!this.initialized) throw new Error('Database not initialized');

    this.files.delete(filePath);
    this.elements.delete(filePath);
  }

  async getFileIndex(filePath: string): Promise<FileIndex | null> {
    if (!this.initialized) throw new Error('Database not initialized');

    const fileIndex = this.files.get(filePath);
    if (!fileIndex) return null;

    return {
      ...fileIndex,
      elements: this.elements.get(filePath) || []
    };
  }

  async searchElements(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.initialized) throw new Error('Database not initialized');

    const results: SearchResult[] = [];

    for (const [filePath, elements] of this.elements) {
      for (const element of elements) {
        let matches = true;

        if (query.text && !element.name.toLowerCase().includes(query.text.toLowerCase())) {
          matches = false;
        }

        if (query.type && element.type !== query.type) {
          matches = false;
        }

        if (query.language) {
          const fileIndex = this.files.get(filePath);
          if (!fileIndex || fileIndex.language !== query.language) {
            matches = false;
          }
        }

        if (query.filePath && !filePath.includes(query.filePath)) {
          matches = false;
        }

        if (matches) {
          results.push({
            element,
            relevance: 1.0,
            highlights: []
          });
        }
      }
    }

    return results;
  }

  async getElementsByType(type: string): Promise<CodeElement[]> {
    if (!this.initialized) throw new Error('Database not initialized');

    const elements: CodeElement[] = [];

    for (const elementList of this.elements.values()) {
      for (const element of elementList) {
        if (element.type === type) {
          elements.push(element);
        }
      }
    }

    return elements;
  }

  async getDependencies(filePath: string): Promise<string[]> {
    if (!this.initialized) throw new Error('Database not initialized');

    const fileIndex = this.files.get(filePath);
    return fileIndex ? fileIndex.dependencies : [];
  }

  async getIndexStatus(): Promise<IndexStatus> {
    if (!this.initialized) throw new Error('Database not initialized');

    return {
      totalFiles: this.files.size,
      indexedFiles: this.files.size,
      lastIndexed: new Date(),
      isComplete: true
    };
  }

  async close(): Promise<void> {
    this.initialized = false;
    this.files.clear();
    this.elements.clear();
  }

  private calculateContentHash(fileIndex: FileIndex): string {
    const content = JSON.stringify(fileIndex);
    return createHash('sha256').update(content).digest('hex');
  }
} 