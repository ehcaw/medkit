import { readFile, stat } from 'fs/promises';
import { extname, basename } from 'path';
import * as ts from 'typescript';
import { DataValidator } from '../utils/validation.js';

export interface ParsedFile {
  path: string;
  content: string;
  language: string;
  ast?: ts.SourceFile;
  error?: string;
  metadata: FileMetadata;
}

export interface FileMetadata {
  size: number;
  lines: number;
  functions: number;
  classes: number;
  imports: number;
  exports: number;
  complexity: number;
  dependencies: string[];
  frameworks: string[];
}

export class CodeParser {
  private supportedExtensions = new Map<string, string>([
    // JavaScript/TypeScript
    ['.js', 'javascript'],
    ['.jsx', 'javascript'],
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    
    // HTML/CSS
    ['.html', 'html'],
    ['.htm', 'html'],
    ['.css', 'css'],
    ['.scss', 'scss'],
    ['.sass', 'sass'],
    ['.less', 'less'],
    
    // Other web formats
    ['.json', 'json'],
    ['.xml', 'xml'],
    ['.svg', 'svg'],
    
    // Configuration files
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
    ['.toml', 'toml'],
    ['.ini', 'ini'],
    ['.cfg', 'ini'],
    
    // Documentation
    ['.md', 'markdown'],
    ['.markdown', 'markdown'],
    ['.txt', 'text'],
    ['.rst', 'rst'],
    ['.adoc', 'asciidoc']
  ]);

  async parseFile(filePath: string, maxSize: number = 10 * 1024 * 1024): Promise<ParsedFile> {
    try {
      // Validate file path
      if (!DataValidator.validateFilePath(filePath)) {
        throw new Error(`Invalid file path: ${filePath}`);
      }

      // Get file stats
      const stats = await stat(filePath);
      if (stats.size > maxSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${maxSize})`);
      }

      // Read file content
      const content = await readFile(filePath, 'utf-8');
      const sanitizedContent = DataValidator.sanitizeInput(content);

      // Detect language
      const language = this.detectLanguage(filePath, sanitizedContent);

      // Parse based on language
      const result: ParsedFile = {
        path: filePath,
        content: sanitizedContent,
        language,
        metadata: this.calculateMetadata(sanitizedContent, language)
      };

      // Generate AST for supported languages
      if (this.isLanguageSupported(language)) {
        try {
          result.ast = await this.generateAST(sanitizedContent, language, filePath);
        } catch (error) {
          result.error = `Failed to generate AST: ${error}`;
        }
      }

      return result;

    } catch (error) {
      throw new Error(`Failed to parse file ${filePath}: ${error}`);
    }
  }

  async parseCode(content: string, language: string, fileName: string = 'unknown'): Promise<ParsedFile> {
    try {
      const sanitizedContent = DataValidator.sanitizeInput(content);

      const result: ParsedFile = {
        path: fileName,
        content: sanitizedContent,
        language,
        metadata: this.calculateMetadata(sanitizedContent, language)
      };

      if (this.isLanguageSupported(language)) {
        try {
          result.ast = await this.generateAST(sanitizedContent, language, fileName);
        } catch (error) {
          result.error = `Failed to generate AST: ${error}`;
        }
      }

      return result;

    } catch (error) {
      throw new Error(`Failed to parse code: ${error}`);
    }
  }

  private detectLanguage(filePath: string, content: string): string {
    const extension = extname(filePath).toLowerCase();
    
    // Check extension mapping first
    if (this.supportedExtensions.has(extension)) {
      return this.supportedExtensions.get(extension)!;
    }

    // Check for shebang
    const shebang = content.match(/^#!([^\n]+)/);
    if (shebang) {
      const interpreter = shebang[1].toLowerCase();
      if (interpreter.includes('node') || interpreter.includes('js')) return 'javascript';
      if (interpreter.includes('python')) return 'python';
      if (interpreter.includes('bash') || interpreter.includes('sh')) return 'bash';
    }

    // Check for HTML doctype
    if (content.trim().toLowerCase().startsWith('<!doctype html>')) {
      return 'html';
    }

    // Check for React JSX patterns
    if (content.includes('import React') || content.includes('from "react"') || content.includes('from \'react\'')) {
      return 'javascript';
    }

    // Check for TypeScript patterns
    if (content.includes(': string') || content.includes(': number') || content.includes(': boolean') || 
        content.includes('interface ') || content.includes('type ') || content.includes('enum ')) {
      return 'typescript';
    }

    // Default to text
    return 'text';
  }

  private isLanguageSupported(language: string): boolean {
    return ['javascript', 'typescript', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml'].includes(language);
  }

  private async generateAST(content: string, language: string, fileName: string): Promise<ts.SourceFile | undefined> {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.generateTypeScriptAST(content, fileName, language === 'typescript');
      
      case 'html':
        return this.generateHTMLAST(content, fileName);
      
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return this.generateCSSAST(content, fileName);
      
      case 'json':
        return this.generateJSONAST(content, fileName);
      
      case 'xml':
        return this.generateXMLAST(content, fileName);
      
      default:
        return undefined;
    }
  }

  private generateTypeScriptAST(content: string, fileName: string, isTypeScript: boolean = false): ts.SourceFile {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      allowJs: true,
      checkJs: false,
      jsx: ts.JsxEmit.React,
      strict: false,
      skipLibCheck: true
    };

    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      isTypeScript ? ts.ScriptTarget.ES2020 : ts.ScriptTarget.ES2020,
      true,
      isTypeScript ? ts.ScriptKind.TS : ts.ScriptKind.JS
    );

    return sourceFile;
  }

  private generateHTMLAST(content: string, fileName: string): ts.SourceFile {
    // Create a simple AST structure for HTML
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.JS
    );

    return sourceFile;
  }

  private generateCSSAST(content: string, fileName: string): ts.SourceFile {
    // Create a simple AST structure for CSS
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.JS
    );

    return sourceFile;
  }

  private generateJSONAST(content: string, fileName: string): ts.SourceFile {
    // Create a simple AST structure for JSON
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.JSON
    );

    return sourceFile;
  }

  private generateXMLAST(content: string, fileName: string): ts.SourceFile {
    // Create a simple AST structure for XML
    const sourceFile = ts.createSourceFile(
      fileName,
      content,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.JS
    );

    return sourceFile;
  }

  private calculateMetadata(content: string, language: string): FileMetadata {
    const lines = content.split('\n').length;
    const size = Buffer.byteLength(content, 'utf8');

    let functions = 0;
    let classes = 0;
    let imports = 0;
    let exports = 0;
    let complexity = 1;
    const dependencies: string[] = [];
    const frameworks: string[] = [];

    // Language-specific analysis
    switch (language) {
      case 'javascript':
      case 'typescript':
        const jsMetadata = this.analyzeJavaScriptMetadata(content);
        functions = jsMetadata.functions;
        classes = jsMetadata.classes;
        imports = jsMetadata.imports;
        exports = jsMetadata.exports;
        complexity = jsMetadata.complexity;
        dependencies.push(...jsMetadata.dependencies);
        frameworks.push(...jsMetadata.frameworks);
        break;

      case 'html':
        const htmlMetadata = this.analyzeHTMLMetadata(content);
        dependencies.push(...htmlMetadata.dependencies);
        frameworks.push(...htmlMetadata.frameworks);
        break;

      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        const cssMetadata = this.analyzeCSSMetadata(content);
        complexity = cssMetadata.complexity;
        break;
    }

    return {
      size,
      lines,
      functions,
      classes,
      imports,
      exports,
      complexity,
      dependencies,
      frameworks
    };
  }

  private analyzeJavaScriptMetadata(content: string) {
    let functions = 0;
    let classes = 0;
    let imports = 0;
    let exports = 0;
    let complexity = 1;
    const dependencies: string[] = [];
    const frameworks: string[] = [];

    // Count functions
    const functionRegex = /(?:function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|let\s+\w+\s*=\s*\([^)]*\)\s*=>|var\s+\w+\s*=\s*\([^)]*\)\s*=>)/g;
    functions = (content.match(functionRegex) || []).length;

    // Count classes
    const classRegex = /class\s+\w+/g;
    classes = (content.match(classRegex) || []).length;

    // Count imports
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const importMatches = content.matchAll(importRegex);
    for (const match of importMatches) {
      imports++;
      dependencies.push(match[1]);
    }

    // Count exports
    const exportRegex = /export\s+(?:default\s+)?(?:function|class|const|let|var|interface|type)/g;
    exports = (content.match(exportRegex) || []).length;

    // Calculate complexity (simplified)
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'try'];
    let complexityScore = 1;
    for (const keyword of controlFlowKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      complexityScore += (content.match(regex) || []).length;
    }
    complexity = Math.min(complexityScore, 10); // Cap at 10

    // Detect frameworks
    if (content.includes('react') || content.includes('React')) frameworks.push('react');
    if (content.includes('vue') || content.includes('Vue')) frameworks.push('vue');
    if (content.includes('angular') || content.includes('Angular')) frameworks.push('angular');
    if (content.includes('next') || content.includes('Next')) frameworks.push('next');
    if (content.includes('nuxt') || content.includes('Nuxt')) frameworks.push('nuxt');

    return { functions, classes, imports, exports, complexity, dependencies, frameworks };
  }

  private analyzeHTMLMetadata(content: string) {
    const dependencies: string[] = [];
    const frameworks: string[] = [];

    // Extract script sources
    const scriptRegex = /<script[^>]*src\s*=\s*['"]([^'"]+)['"][^>]*>/gi;
    const scriptMatches = content.matchAll(scriptRegex);
    for (const match of scriptMatches) {
      dependencies.push(match[1]);
    }

    // Extract CSS sources
    const cssRegex = /<link[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*>/gi;
    const cssMatches = content.matchAll(cssRegex);
    for (const match of cssMatches) {
      dependencies.push(match[1]);
    }

    // Detect frameworks
    if (content.includes('react') || content.includes('React')) frameworks.push('react');
    if (content.includes('vue') || content.includes('Vue')) frameworks.push('vue');
    if (content.includes('angular') || content.includes('Angular')) frameworks.push('angular');
    if (content.includes('bootstrap')) frameworks.push('bootstrap');
    if (content.includes('tailwind')) frameworks.push('tailwind');

    return { dependencies, frameworks };
  }

  private analyzeCSSMetadata(content: string) {
    let complexity = 1;

    // Calculate complexity based on selectors and rules
    const selectors = content.match(/[.#]?\w+(?:\s*[.#]\w+)*\s*{/g) || [];
    const mediaQueries = content.match(/@media/g) || [];
    const keyframes = content.match(/@keyframes/g) || [];

    complexity = Math.min(1 + selectors.length * 0.1 + mediaQueries.length * 0.5 + keyframes.length * 0.3, 10);

    return { complexity };
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.supportedExtensions.values());
  }

  isFileSupported(filePath: string): boolean {
    const extension = extname(filePath).toLowerCase();
    return this.supportedExtensions.has(extension);
  }
} 