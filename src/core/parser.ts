import Parser from 'tree-sitter';
import { ASTNode, Position } from '../types/index.js';

export class TreeSitterParser {
  private parsers: Map<string, Parser> = new Map();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize parsers for supported languages
      await this.loadParser('javascript');
      await this.loadParser('typescript');
      await this.loadParser('python');
      await this.loadParser('rust');
      await this.loadParser('c');
      await this.loadParser('cpp');
      
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize some Tree-sitter parsers:', error);
    }
  }

  private async loadParser(language: string): Promise<void> {
    try {
      let parserModule: any;
      
      switch (language) {
        case 'javascript':
          parserModule = await import('tree-sitter-javascript');
          break;
        case 'typescript':
          parserModule = await import('tree-sitter-typescript');
          break;
        case 'python':
          parserModule = await import('tree-sitter-python');
          break;
        case 'rust':
          parserModule = await import('tree-sitter-rust');
          break;
        case 'c':
          parserModule = await import('tree-sitter-c');
          break;
        case 'cpp':
          parserModule = await import('tree-sitter-cpp');
          break;
        default:
          return;
      }

      const parser = new Parser();
      parser.setLanguage(parserModule.default);
      this.parsers.set(language, parser);
    } catch (error) {
      console.warn(`Failed to load parser for ${language}:`, error);
    }
  }

  async parseFile(filePath: string, language: string, content: string): Promise<ASTNode | null> {
    await this.initialize();

    const parser = this.parsers.get(language);
    if (!parser) {
      console.warn(`No parser available for language: ${language}`);
      return null;
    }

    try {
      const tree = parser.parse(content);
      return this.convertTreeSitterNode(tree.rootNode, content);
    } catch (error) {
      console.warn(`Failed to parse file ${filePath}:`, error);
      return null;
    }
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.parsers.keys());
  }

  isLanguageSupported(language: string): boolean {
    return this.parsers.has(language);
  }

  private convertTreeSitterNode(node: Parser.SyntaxNode, content: string): ASTNode {
    const children: ASTNode[] = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child) {
        children.push(this.convertTreeSitterNode(child, content));
      }
    }

    return {
      type: node.type,
      text: node.text,
      startPosition: {
        row: node.startPosition.row,
        column: node.startPosition.column
      },
      endPosition: {
        row: node.endPosition.row,
        column: node.endPosition.column
      },
      children,
      parent: undefined // Will be set by parent nodes
    };
  }

  // Helper method to find nodes by type
  findNodesByType(ast: ASTNode, type: string): ASTNode[] {
    const results: ASTNode[] = [];
    
    if (ast.type === type) {
      results.push(ast);
    }
    
    for (const child of ast.children) {
      results.push(...this.findNodesByType(child, type));
    }
    
    return results;
  }

  // Helper method to find nodes by type and name
  findNodesByName(ast: ASTNode, type: string, name: string): ASTNode[] {
    const results: ASTNode[] = [];
    
    if (ast.type === type && ast.text.includes(name)) {
      results.push(ast);
    }
    
    for (const child of ast.children) {
      results.push(...this.findNodesByName(child, type, name));
    }
    
    return results;
  }

  // Helper method to get node at position
  getNodeAtPosition(ast: ASTNode, position: Position): ASTNode | null {
    if (this.isPositionInNode(ast, position)) {
      // Check children first (more specific)
      for (const child of ast.children) {
        const childNode = this.getNodeAtPosition(child, position);
        if (childNode) {
          return childNode;
        }
      }
      
      // If no child contains the position, return this node
      return ast;
    }
    
    return null;
  }

  private isPositionInNode(node: ASTNode, position: Position): boolean {
    const start = node.startPosition;
    const end = node.endPosition;
    
    if (position.row < start.row || position.row > end.row) {
      return false;
    }
    
    if (position.row === start.row && position.column < start.column) {
      return false;
    }
    
    if (position.row === end.row && position.column > end.column) {
      return false;
    }
    
    return true;
  }

  // Helper method to get the text content of a node
  getNodeText(node: ASTNode): string {
    return node.text;
  }

  // Helper method to get the line number of a node
  getNodeLine(node: ASTNode): number {
    return node.startPosition.row;
  }

  // Helper method to get the column number of a node
  getNodeColumn(node: ASTNode): number {
    return node.startPosition.column;
  }

  // Helper method to check if a node has a specific type
  hasType(node: ASTNode, type: string): boolean {
    return node.type === type;
  }

  // Helper method to check if a node has a specific text
  hasText(node: ASTNode, text: string): boolean {
    return node.text.includes(text);
  }

  // Helper method to get all descendant nodes
  getAllDescendants(node: ASTNode): ASTNode[] {
    const descendants: ASTNode[] = [];
    
    for (const child of node.children) {
      descendants.push(child);
      descendants.push(...this.getAllDescendants(child));
    }
    
    return descendants;
  }

  // Helper method to get direct children of a specific type
  getChildrenOfType(node: ASTNode, type: string): ASTNode[] {
    return node.children.filter(child => child.type === type);
  }

  // Helper method to get the first child of a specific type
  getFirstChildOfType(node: ASTNode, type: string): ASTNode | null {
    return node.children.find(child => child.type === type) || null;
  }

  // Helper method to get the parent node (if available)
  getParent(node: ASTNode): ASTNode | null {
    return node.parent || null;
  }

  // Helper method to get siblings of a node
  getSiblings(node: ASTNode): ASTNode[] {
    if (!node.parent) {
      return [];
    }
    
    return node.parent.children.filter(child => child !== node);
  }

  // Helper method to get the next sibling
  getNextSibling(node: ASTNode): ASTNode | null {
    if (!node.parent) {
      return null;
    }
    
    const index = node.parent.children.indexOf(node);
    if (index === -1 || index === node.parent.children.length - 1) {
      return null;
    }
    
    return node.parent.children[index + 1];
  }

  // Helper method to get the previous sibling
  getPreviousSibling(node: ASTNode): ASTNode | null {
    if (!node.parent) {
      return null;
    }
    
    const index = node.parent.children.indexOf(node);
    if (index <= 0) {
      return null;
    }
    
    return node.parent.children[index - 1];
  }
} 