import { ASTNode, FileIndex } from '../../types/index.js';

export abstract class BaseAnalyzer {
  abstract analyzeAST(ast: ASTNode, filePath: string): FileIndex;
  
  protected findNodesByType(ast: ASTNode, types: string[]): ASTNode[] {
    const results: ASTNode[] = [];
    
    if (types.includes(ast.type)) {
      results.push(ast);
    }
    
    for (const child of ast.children) {
      results.push(...this.findNodesByType(child, types));
    }
    
    return results;
  }

  protected findNodesByName(ast: ASTNode, type: string, name: string): ASTNode[] {
    const results: ASTNode[] = [];
    
    if (ast.type === type && ast.text.includes(name)) {
      results.push(ast);
    }
    
    for (const child of ast.children) {
      results.push(...this.findNodesByName(child, type, name));
    }
    
    return results;
  }

  protected extractIdentifier(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  protected extractStringLiteral(node: ASTNode): string | null {
    const strings = this.findNodesByType(node, ['string', 'string_literal']);
    if (strings.length > 0) {
      return strings[0].text.replace(/['"]/g, '');
    }
    return null;
  }

  protected extractComment(node: ASTNode): string | undefined {
    const comments = this.findNodesByType(node, ['comment', 'block_comment', 'line_comment']);
    return comments.length > 0 ? comments[0].text.trim() : undefined;
  }

  protected getNodePosition(node: ASTNode): { line: number; column: number } {
    return {
      line: node.startPosition.row + 1,
      column: node.startPosition.column + 1
    };
  }
} 