export interface Position {
  row: number;
  column: number;
}

export interface ASTNode {
  type: string;
  text: string;
  startPosition: Position;
  endPosition: Position;
  children: ASTNode[];
  parent?: ASTNode;
}

export interface FileInfo {
  path: string;
  size: number;
  modified: Date;
  language?: string;
  content?: string;
}

export interface LanguageInfo {
  name: string;
  confidence: number;
  parser?: string;
}

export interface CodeElement {
  type: 'function' | 'class' | 'variable' | 'import' | 'export' | 'interface' | 'type' | 'enum' | 'namespace';
  name: string;
  path: string;
  line: number;
  column: number;
  signature?: string;
  documentation?: string;
  visibility?: 'public' | 'private' | 'protected';
  modifiers?: string[];
  returnType?: string;
  parameters?: Parameter[];
}

export interface Parameter {
  name: string;
  type?: string;
  defaultValue?: string;
}

export interface ImportInfo {
  path: string;
  imports: string[];
  isDefault?: boolean;
  alias?: string;
}

export interface ExportInfo {
  name: string;
  type: 'default' | 'named' | 'namespace';
  path?: string;
}

export interface FileMetrics {
  lines: number;
  functions: number;
  classes: number;
  variables: number;
  complexity: number;
}

export interface FileIndex {
  path: string;
  language: string;
  elements: CodeElement[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  dependencies: string[];
  metrics: FileMetrics;
}

export interface SearchQuery {
  text?: string;
  type?: string;
  language?: string;
  filePath?: string;
  caseSensitive?: boolean;
  regex?: boolean;
}

export interface SearchResult {
  element: CodeElement;
  relevance: number;
  highlights: Highlight[];
}

export interface Highlight {
  start: number;
  end: number;
  text: string;
}

export interface CallGraph {
  function: string;
  calls: string[];
  calledBy: string[];
}

export interface IndexStatus {
  totalFiles: number;
  indexedFiles: number;
  lastIndexed: Date;
  isComplete: boolean;
}

export interface ScanOptions {
  ignorePatterns?: string[];
  maxFileSize?: number;
  includeHidden?: boolean;
  parallel?: boolean;
  maxWorkers?: number;
}

export interface IndexerOptions {
  databasePath?: string;
  maxFileSize?: number;
  ignorePatterns?: string[];
  parallel?: boolean;
  maxWorkers?: number;
  verbose?: boolean;
} 