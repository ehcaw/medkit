import { ASTNode, FileIndex, CodeElement, ImportInfo, ExportInfo, FileMetrics, Parameter } from '../../types/index.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class PythonAnalyzer extends BaseAnalyzer {
  analyzeAST(ast: ASTNode, filePath: string): FileIndex {
    const elements: CodeElement[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const dependencies: string[] = [];

    this.extractFunctions(ast, filePath, elements);
    this.extractClasses(ast, filePath, elements);
    this.extractVariables(ast, filePath, elements);
    this.extractImports(ast, imports);
    this.extractExports(ast, exports);

    const metrics = this.calculateMetrics(ast);

    return {
      path: filePath,
      language: 'python',
      elements,
      imports,
      exports,
      dependencies,
      metrics
    };
  }

  private extractFunctions(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const functionNodes = this.findNodesByType(ast, ['function_definition']);
    
    for (const node of functionNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'function',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractFunctionSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node),
          parameters: this.extractParameters(node),
          returnType: this.extractReturnType(node)
        });
      }
    }
  }

  private extractClasses(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const classNodes = this.findNodesByType(ast, ['class_definition']);
    
    for (const node of classNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'class',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractClassSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractVariables(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const variableNodes = this.findNodesByType(ast, ['assignment']);
    
    for (const node of variableNodes) {
      const name = this.extractVariableName(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'variable',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractVariableSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractImports(ast: ASTNode, imports: ImportInfo[]): void {
    const importNodes = this.findNodesByType(ast, ['import_statement', 'import_from_statement']);
    
    for (const node of importNodes) {
      const importInfo = this.extractImportInfo(node);
      if (importInfo) {
        imports.push(importInfo);
      }
    }
  }

  private extractExports(ast: ASTNode, exports: ExportInfo[]): void {
    // Python doesn't have explicit exports, but we can look for __all__ assignments
    const allNodes = this.findNodesByName(ast, 'assignment', '__all__');
    
    for (const node of allNodes) {
      exports.push({
        name: '__all__',
        type: 'named',
        path: undefined
      });
    }
  }

  private extractVariableName(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractFunctionSignature(node: ASTNode): string | undefined {
    const paramList = this.findNodesByType(node, ['parameters'])[0];
    if (paramList) {
      const params = this.extractParameters(node);
      const paramStr = params.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ');
      return `(${paramStr})`;
    }
    return undefined;
  }

  private extractClassSignature(node: ASTNode): string | undefined {
    const argumentList = this.findNodesByType(node, ['argument_list'])[0];
    if (argumentList) {
      return argumentList.text;
    }
    return undefined;
  }

  private extractVariableSignature(node: ASTNode): string | undefined {
    const typeAnnotation = this.findNodesByType(node, ['type'])[0];
    return typeAnnotation ? `: ${typeAnnotation.text}` : undefined;
  }

  private extractVisibility(node: ASTNode): 'public' | 'private' | 'protected' | undefined {
    const name = this.extractIdentifier(node);
    if (name && name.startsWith('_')) {
      return name.startsWith('__') ? 'private' : 'protected';
    }
    return 'public';
  }

  private extractModifiers(node: ASTNode): string[] {
    const modifiers: string[] = [];
    const decorators = this.findNodesByType(node, ['decorator']);
    
    for (const decorator of decorators) {
      modifiers.push(decorator.text);
    }
    
    return modifiers;
  }

  private extractParameters(node: ASTNode): Parameter[] {
    const parameters: Parameter[] = [];
    const paramNodes = this.findNodesByType(node, ['parameter']);
    
    for (const paramNode of paramNodes) {
      const name = this.extractIdentifier(paramNode);
      const type = this.extractParameterType(paramNode);
      const defaultValue = this.extractParameterDefault(paramNode);
      
      if (name) {
        parameters.push({
          name,
          type,
          defaultValue
        });
      }
    }
    
    return parameters;
  }

  private extractParameterType(node: ASTNode): string | undefined {
    const typeAnnotation = this.findNodesByType(node, ['type'])[0];
    return typeAnnotation ? typeAnnotation.text : undefined;
  }

  private extractParameterDefault(node: ASTNode): string | undefined {
    const defaultNode = this.findNodesByType(node, ['default'])[0];
    return defaultNode ? defaultNode.text : undefined;
  }

  private extractReturnType(node: ASTNode): string | undefined {
    const returnType = this.findNodesByType(node, ['type'])[0];
    return returnType ? returnType.text : undefined;
  }

  private extractImportInfo(node: ASTNode): ImportInfo | null {
    const source = this.extractStringLiteral(node);
    if (!source) return null;

    const imports: string[] = [];
    let isDefault = false;
    let alias: string | undefined;

    if (node.type === 'import_from_statement') {
      const importList = this.findNodesByType(node, ['dotted_name']);
      for (const importItem of importList) {
        const imported = this.extractIdentifier(importItem);
        if (imported) {
          imports.push(imported);
        }
      }
    } else {
      const importList = this.findNodesByType(node, ['dotted_name']);
      for (const importItem of importList) {
        const imported = this.extractIdentifier(importItem);
        if (imported) {
          imports.push(imported);
        }
      }
    }

    return {
      path: source,
      imports,
      isDefault,
      alias
    };
  }

  private calculateMetrics(ast: ASTNode): FileMetrics {
    const lines = ast.endPosition.row - ast.startPosition.row + 1;
    const functions = this.findNodesByType(ast, ['function_definition']).length;
    const classes = this.findNodesByType(ast, ['class_definition']).length;
    const variables = this.findNodesByType(ast, ['assignment']).length;
    const complexity = this.calculateComplexity(ast);

    return {
      lines,
      functions,
      classes,
      variables,
      complexity
    };
  }

  private calculateComplexity(ast: ASTNode): number {
    let complexity = 1;
    
    const controlFlowTypes = [
      'if_statement',
      'elif_clause',
      'else_clause',
      'for_statement',
      'while_statement',
      'try_statement',
      'except_clause',
      'finally_clause',
      'with_statement',
      'conditional_expression'
    ];
    
    for (const type of controlFlowTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      complexity += nodes.length;
    }
    
    return complexity;
  }
} 