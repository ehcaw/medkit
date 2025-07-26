# Codebase Indexer with HelixDB and Tree-sitter

## Overview

This document outlines the plan for building a high-performance codebase indexer that combines HelixDB (for fast, embedded database storage) with Tree-sitter (for accurate language parsing and AST analysis).

## Architecture

### Core Components

1. **File System Scanner** - Recursively discovers files in the codebase
2. **Language Detector** - Identifies programming languages for each file
3. **Tree-sitter Parser** - Generates ASTs for supported languages
4. **AST Analyzer** - Extracts meaningful information from ASTs
5. **HelixDB Storage** - Stores indexed data efficiently
6. **Query Engine** - Provides search and retrieval capabilities
7. **Index Manager** - Handles incremental updates and maintenance

### Data Flow

```
Codebase → File Scanner → Language Detector → Tree-sitter Parser → AST Analyzer → HelixDB Storage
                                                                    ↓
Query Engine ← Index Manager ← HelixDB Storage
```

## Implementation Plan

### Phase 1: Foundation Setup

#### 1.1 Project Structure
```
codebase-indexer/
├── src/
│   ├── core/
│   │   ├── scanner.ts          # File system scanner
│   │   ├── detector.ts         # Language detection
│   │   ├── parser.ts           # Tree-sitter integration
│   │   ├── analyzer.ts         # AST analysis
│   │   └── storage.ts          # HelixDB operations
│   ├── languages/              # Language-specific parsers
│   ├── queries/                # Query engine
│   ├── utils/                  # Utilities
│   └── index.ts               # Main entry point
├── tests/
├── package.json
└── tsconfig.json
```

#### 1.2 Dependencies
```json
{
  "dependencies": {
    "tree-sitter": "^0.20.6",
    "tree-sitter-javascript": "^0.20.0",
    "tree-sitter-typescript": "^0.20.1",
    "tree-sitter-python": "^0.20.1",
    "tree-sitter-rust": "^0.20.1",
    "tree-sitter-go": "^0.20.1",
    "tree-sitter-c": "^0.20.2",
    "tree-sitter-cpp": "^0.20.0",
    "helixdb": "^0.1.0",        // Replace with actual HelixDB package
    "glob": "^10.3.10",
    "mime-types": "^2.1.35",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

### Phase 2: Core Components

#### 2.1 File System Scanner
```typescript
interface FileInfo {
  path: string;
  size: number;
  modified: Date;
  language?: string;
  content?: string;
}

class FileScanner {
  async scanDirectory(rootPath: string, options: ScanOptions): Promise<FileInfo[]>
  async getFileContent(filePath: string): Promise<string>
  shouldSkipFile(filePath: string): boolean
}
```

**Features:**
- Recursive directory scanning
- File filtering (ignore patterns, size limits)
- Incremental scanning (only changed files)
- Parallel processing for large codebases

#### 2.2 Language Detector
```typescript
interface LanguageInfo {
  name: string;
  confidence: number;
  parser?: string;
}

class LanguageDetector {
  detectLanguage(filePath: string, content?: string): LanguageInfo
  getSupportedLanguages(): string[]
  isLanguageSupported(language: string): boolean
}
```

**Detection Methods:**
- File extension mapping
- Shebang line analysis
- Content-based detection (first few lines)
- MIME type detection

#### 2.3 Tree-sitter Parser Integration
```typescript
interface ASTNode {
  type: string;
  text: string;
  startPosition: Position;
  endPosition: Position;
  children: ASTNode[];
  parent?: ASTNode;
}

class TreeSitterParser {
  private parsers: Map<string, Parser>
  
  async parseFile(filePath: string, language: string): Promise<ASTNode>
  getSupportedLanguages(): string[]
  createParser(language: string): Parser
}
```

**Supported Languages (Initial):**
- JavaScript/TypeScript
- Python
- Rust
- Go
- C/C++
- Java
- Ruby
- PHP

### Phase 3: AST Analysis

#### 3.1 Extracted Information
```typescript
interface CodeElement {
  type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'interface' | 'type';
  name: string;
  path: string;
  line: number;
  column: number;
  signature?: string;
  documentation?: string;
  visibility?: 'public' | 'private' | 'protected';
  modifiers?: string[];
}

interface FileIndex {
  path: string;
  language: string;
  elements: CodeElement[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
  metrics: FileMetrics;
}
```

#### 3.2 Language-Specific Analyzers
```typescript
abstract class BaseAnalyzer {
  abstract analyzeAST(ast: ASTNode, filePath: string): FileIndex
  abstract extractFunctions(ast: ASTNode): CodeElement[]
  abstract extractClasses(ast: ASTNode): CodeElement[]
  abstract extractImports(ast: ASTNode): ImportInfo[]
}

class JavaScriptAnalyzer extends BaseAnalyzer {
  // JavaScript/TypeScript specific analysis
}

class PythonAnalyzer extends BaseAnalyzer {
  // Python specific analysis
}
```

### Phase 4: HelixDB Storage

#### 4.1 Database Schema
```sql
-- Files table
CREATE TABLE files (
  id INTEGER PRIMARY KEY,
  path TEXT UNIQUE NOT NULL,
  language TEXT NOT NULL,
  size INTEGER NOT NULL,
  modified DATETIME NOT NULL,
  indexed_at DATETIME NOT NULL,
  content_hash TEXT NOT NULL
);

-- Elements table
CREATE TABLE elements (
  id INTEGER PRIMARY KEY,
  file_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  line INTEGER NOT NULL,
  column INTEGER NOT NULL,
  signature TEXT,
  documentation TEXT,
  visibility TEXT,
  modifiers TEXT,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Dependencies table
CREATE TABLE dependencies (
  id INTEGER PRIMARY KEY,
  file_id INTEGER NOT NULL,
  dependency_path TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

-- Search index
CREATE VIRTUAL TABLE search_index USING fts5(
  element_id,
  name,
  signature,
  documentation,
  content='elements',
  content_rowid='id'
);
```

#### 4.2 Storage Operations
```typescript
class HelixDBStorage {
  async initialize(): Promise<void>
  async storeFileIndex(fileIndex: FileIndex): Promise<void>
  async updateFileIndex(fileIndex: FileIndex): Promise<void>
  async deleteFileIndex(filePath: string): Promise<void>
  async getFileIndex(filePath: string): Promise<FileIndex | null>
  async searchElements(query: string): Promise<CodeElement[]>
  async getElementsByType(type: string): Promise<CodeElement[]>
  async getDependencies(filePath: string): Promise<string[]>
}
```

### Phase 5: Query Engine

#### 5.1 Search Capabilities
```typescript
interface SearchQuery {
  text?: string;
  type?: string;
  language?: string;
  filePath?: string;
  caseSensitive?: boolean;
  regex?: boolean;
}

interface SearchResult {
  element: CodeElement;
  relevance: number;
  highlights: Highlight[];
}

class QueryEngine {
  async search(query: SearchQuery): Promise<SearchResult[]>
  async findReferences(elementName: string): Promise<CodeElement[]>
  async findDefinitions(elementName: string): Promise<CodeElement[]>
  async getCallGraph(functionName: string): Promise<CallGraph>
}
```

#### 5.2 Advanced Queries
- Symbol search (functions, classes, variables)
- Reference finding
- Call graph analysis
- Dependency analysis
- Code metrics and statistics
- Semantic search (based on documentation and signatures)

### Phase 6: Index Manager

#### 6.1 Incremental Updates
```typescript
class IndexManager {
  async indexCodebase(rootPath: string): Promise<void>
  async updateIndex(filePath: string): Promise<void>
  async removeFromIndex(filePath: string): Promise<void>
  async getIndexStatus(): Promise<IndexStatus>
  async rebuildIndex(): Promise<void>
}
```

#### 6.2 Performance Optimizations
- Incremental indexing (only changed files)
- Parallel processing
- Memory-efficient AST traversal
- Caching strategies
- Background indexing

## Usage Examples

### Basic Indexing
```typescript
import { CodebaseIndexer } from './index';

const indexer = new CodebaseIndexer();
await indexer.indexCodebase('/path/to/codebase');
```

### Search Operations
```typescript
// Find all functions named "calculate"
const results = await indexer.search({
  text: 'calculate',
  type: 'function'
});

// Find all TypeScript classes
const classes = await indexer.search({
  type: 'class',
  language: 'typescript'
});

// Find references to a specific function
const references = await indexer.findReferences('calculateTotal');
```

## Performance Considerations

### Optimization Strategies
1. **Parallel Processing**: Use worker threads for file parsing
2. **Memory Management**: Stream large files instead of loading entirely
3. **Caching**: Cache parsed ASTs and language detection results
4. **Incremental Updates**: Only re-index changed files
5. **Database Optimization**: Use appropriate indexes and query optimization

### Expected Performance
- **Indexing Speed**: ~1000-5000 files/minute (depending on complexity)
- **Search Response**: <100ms for most queries
- **Memory Usage**: ~50-200MB for typical codebases
- **Storage**: ~10-50% of original codebase size

## Future Enhancements

### Phase 7: Advanced Features
1. **Semantic Analysis**: Type inference, call graph analysis
2. **Code Metrics**: Complexity, maintainability scores
3. **Refactoring Support**: Rename, move, extract operations
4. **IDE Integration**: LSP server, VS Code extension
5. **Collaborative Features**: Multi-user indexing, sharing

### Phase 8: Language Support
1. **Additional Languages**: Kotlin, Swift, Scala, Haskell
2. **Configuration Files**: YAML, JSON, TOML, INI
3. **Documentation**: Markdown, AsciiDoc, RST
4. **Build Systems**: Make, CMake, Gradle, Maven

## Testing Strategy

### Unit Tests
- Language detection accuracy
- AST parsing correctness
- Database operations
- Search functionality

### Integration Tests
- End-to-end indexing workflows
- Performance benchmarks
- Large codebase handling

### Test Data
- Open source projects (React, Vue, Rust, etc.)
- Generated test codebases
- Edge cases and error conditions

## Deployment

### Development Setup
```bash
npm install
npm run build
npm run test
```

### Production Considerations
- Database backup strategies
- Monitoring and logging
- Error handling and recovery
- Scalability planning

## Conclusion

This codebase indexer will provide fast, accurate, and comprehensive code analysis capabilities. The combination of Tree-sitter for parsing and HelixDB for storage offers excellent performance and reliability for large-scale codebases.

The modular architecture allows for easy extension and maintenance, while the incremental indexing ensures efficient updates as codebases evolve. 