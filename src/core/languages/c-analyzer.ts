import { ASTNode, FileIndex, CodeElement, ImportInfo, ExportInfo, FileMetrics, Parameter } from '../../types/index.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class CAnalyzer extends BaseAnalyzer {
  analyzeAST(ast: ASTNode, filePath: string): FileIndex {
    const elements: CodeElement[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const dependencies: string[] = [];

    this.extractFunctions(ast, filePath, elements);
    this.extractStructs(ast, filePath, elements);
    this.extractUnions(ast, filePath, elements);
    this.extractEnums(ast, filePath, elements);
    this.extractTypedefs(ast, filePath, elements);
    this.extractVariables(ast, filePath, elements);
    this.extractIncludes(ast, imports);

    const metrics = this.calculateMetrics(ast);

    return {
      path: filePath,
      language: 'c',
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
      const name = this.extractFunctionName(node);
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
    const structNodes = this.findNodesByType(ast, ['struct_declaration']);
    
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

  private extractUnions(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const unionNodes = this.findNodesByType(ast, ['union_declaration']);
    
    for (const node of unionNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'class',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractUnionSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractEnums(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const enumNodes = this.findNodesByType(ast, ['enum_declaration']);
    
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

  private extractTypedefs(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const typedefNodes = this.findNodesByType(ast, ['typedef_declaration']);
    
    for (const node of typedefNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'type',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractTypedefSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractVariables(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const variableNodes = this.findNodesByType(ast, ['declaration']);
    
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

  private extractIncludes(ast: ASTNode, imports: ImportInfo[]): void {
    const includeNodes = this.findNodesByType(ast, ['preproc_include']);
    
    for (const node of includeNodes) {
      const importInfo = this.extractIncludeInfo(node);
      if (importInfo) {
        imports.push(importInfo);
      }
    }
  }

  private extractFunctionName(node: ASTNode): string | null {
    const declarator = this.findNodesByType(node, ['function_declarator'])[0];
    if (declarator) {
      return this.extractIdentifier(declarator);
    }
    return null;
  }

  private extractVariableName(node: ASTNode): string | null {
    const declarator = this.findNodesByType(node, ['init_declarator'])[0];
    if (declarator) {
      return this.extractIdentifier(declarator);
    }
    return null;
  }

  private extractFunctionSignature(node: ASTNode): string | undefined {
    const paramList = this.findNodesByType(node, ['parameter_list'])[0];
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

  private extractUnionSignature(node: ASTNode): string | undefined {
    const fieldList = this.findNodesByType(node, ['field_declaration_list'])[0];
    return fieldList ? fieldList.text : undefined;
  }

  private extractEnumSignature(node: ASTNode): string | undefined {
    const enumeratorList = this.findNodesByType(node, ['enumerator_list'])[0];
    return enumeratorList ? enumeratorList.text : undefined;
  }

  private extractTypedefSignature(node: ASTNode): string | undefined {
    const type = this.findNodesByType(node, ['type'])[0];
    return type ? `= ${type.text}` : undefined;
  }

  private extractVariableSignature(node: ASTNode): string | undefined {
    const type = this.findNodesByType(node, ['type'])[0];
    return type ? `: ${type.text}` : undefined;
  }

  private extractVisibility(node: ASTNode): 'public' | 'private' | 'protected' | undefined {
    // C doesn't have visibility modifiers like C++, everything is public
    return 'public';
  }

  private extractModifiers(node: ASTNode): string[] {
    const modifiers: string[] = [];
    const modifierNodes = this.findNodesByType(node, ['storage_class_specifier', 'type_qualifier']);
    
    for (const modifierNode of modifierNodes) {
      modifiers.push(modifierNode.text);
    }
    
    return modifiers;
  }

  private extractParameters(node: ASTNode): Parameter[] {
    const parameters: Parameter[] = [];
    const paramNodes = this.findNodesByType(node, ['parameter_declaration']);
    
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
    const type = this.findNodesByType(node, ['type'])[0];
    return type ? type.text : undefined;
  }

  private extractParameterDefault(node: ASTNode): string | undefined {
    // C doesn't support default parameter values
    return undefined;
  }

  private extractReturnType(node: ASTNode): string | undefined {
    const type = this.findNodesByType(node, ['type'])[0];
    return type ? type.text : undefined;
  }

  private extractIncludeInfo(node: ASTNode): ImportInfo | null {
    const source = this.extractStringLiteral(node);
    if (!source) return null;

    return {
      path: source,
      imports: [],
      isDefault: false,
      alias: undefined
    };
  }

  private calculateMetrics(ast: ASTNode): FileMetrics {
    const lines = ast.endPosition.row - ast.startPosition.row + 1;
    const functions = this.findNodesByType(ast, ['function_definition']).length;
    const classes = this.findNodesByType(ast, ['struct_declaration', 'union_declaration']).length;
    const variables = this.findNodesByType(ast, ['declaration']).length;
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
      'else_clause',
      'for_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'case_statement',
      'default_statement',
      'conditional_expression'
    ];
    
    for (const type of controlFlowTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      complexity += nodes.length;
    }
    
    return complexity;
  }
} 