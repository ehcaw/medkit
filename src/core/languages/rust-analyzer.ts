import { ASTNode, FileIndex, CodeElement, ImportInfo, ExportInfo, FileMetrics, Parameter } from '../../types/index.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class RustAnalyzer extends BaseAnalyzer {
  analyzeAST(ast: ASTNode, filePath: string): FileIndex {
    const elements: CodeElement[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const dependencies: string[] = [];

    this.extractFunctions(ast, filePath, elements);
    this.extractStructs(ast, filePath, elements);
    this.extractEnums(ast, filePath, elements);
    this.extractTraits(ast, filePath, elements);
    this.extractVariables(ast, filePath, elements);
    this.extractImports(ast, imports);
    this.extractExports(ast, exports);

    const metrics = this.calculateMetrics(ast);

    return {
      path: filePath,
      language: 'rust',
      elements,
      imports,
      exports,
      dependencies,
      metrics
    };
  }

  private extractFunctions(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const functionNodes = this.findNodesByType(ast, ['function_item']);
    
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

  private extractStructs(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const structNodes = this.findNodesByType(ast, ['struct_item']);
    
    for (const node of structNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'class',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractStructSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractEnums(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const enumNodes = this.findNodesByType(ast, ['enum_item']);
    
    for (const node of enumNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'enum',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractEnumSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractTraits(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const traitNodes = this.findNodesByType(ast, ['trait_item']);
    
    for (const node of traitNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'interface',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractTraitSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractVariables(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const variableNodes = this.findNodesByType(ast, ['let_declaration', 'const_item', 'static_item']);
    
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
    const importNodes = this.findNodesByType(ast, ['use_declaration']);
    
    for (const node of importNodes) {
      const importInfo = this.extractImportInfo(node);
      if (importInfo) {
        imports.push(importInfo);
      }
    }
  }

  private extractExports(ast: ASTNode, exports: ExportInfo[]): void {
    const pubNodes = this.findNodesByType(ast, ['pub']);
    
    for (const node of pubNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        exports.push({
          name,
          type: 'named',
          path: undefined
        });
      }
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

  private extractStructSignature(node: ASTNode): string | undefined {
    const fieldList = this.findNodesByType(node, ['field_declaration_list'])[0];
    return fieldList ? fieldList.text : undefined;
  }

  private extractEnumSignature(node: ASTNode): string | undefined {
    const variantList = this.findNodesByType(node, ['enum_variant_list'])[0];
    return variantList ? variantList.text : undefined;
  }

  private extractTraitSignature(node: ASTNode): string | undefined {
    const traitBounds = this.findNodesByType(node, ['trait_bounds'])[0];
    return traitBounds ? traitBounds.text : undefined;
  }

  private extractVariableSignature(node: ASTNode): string | undefined {
    const typeAnnotation = this.findNodesByType(node, ['type'])[0];
    return typeAnnotation ? `: ${typeAnnotation.text}` : undefined;
  }

  private extractVisibility(node: ASTNode): 'public' | 'private' | 'protected' | undefined {
    const pubNode = this.findNodesByType(node, ['pub'])[0];
    return pubNode ? 'public' : 'private';
  }

  private extractModifiers(node: ASTNode): string[] {
    const modifiers: string[] = [];
    const modifierNodes = this.findNodesByType(node, ['pub', 'mut', 'const', 'static']);
    
    for (const modifierNode of modifierNodes) {
      modifiers.push(modifierNode.text);
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

    const importList = this.findNodesByType(node, ['identifier']);
    for (const importItem of importList) {
      const imported = this.extractIdentifier(importItem);
      if (imported) {
        imports.push(imported);
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
    const functions = this.findNodesByType(ast, ['function_item']).length;
    const classes = this.findNodesByType(ast, ['struct_item']).length;
    const variables = this.findNodesByType(ast, ['let_declaration', 'const_item', 'static_item']).length;
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
      'if_expression',
      'else_clause',
      'for_expression',
      'while_expression',
      'loop_expression',
      'match_expression',
      'match_arm',
      'try_expression',
      'conditional_expression'
    ];
    
    for (const type of controlFlowTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      complexity += nodes.length;
    }
    
    return complexity;
  }
} 