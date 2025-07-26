import { ASTNode, FileIndex, CodeElement, ImportInfo, ExportInfo, FileMetrics, Parameter } from '../../types/index.js';
import { BaseAnalyzer } from './base-analyzer.js';

export class JavaScriptAnalyzer extends BaseAnalyzer {
  analyzeAST(ast: ASTNode, filePath: string): FileIndex {
    const elements: CodeElement[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const dependencies: string[] = [];

    // Extract functions
    this.extractFunctions(ast, filePath, elements);
    
    // Extract classes
    this.extractClasses(ast, filePath, elements);
    
    // Extract variables
    this.extractVariables(ast, filePath, elements);
    
    // Extract interfaces (TypeScript)
    this.extractInterfaces(ast, filePath, elements);
    
    // Extract types (TypeScript)
    this.extractTypes(ast, filePath, elements);
    
    // Extract enums (TypeScript)
    this.extractEnums(ast, filePath, elements);
    
    // Extract imports
    this.extractImports(ast, imports);
    
    // Extract exports
    this.extractExports(ast, exports);

    const metrics = this.calculateMetrics(ast);

    return {
      path: filePath,
      language: 'javascript',
      elements,
      imports,
      exports,
      dependencies,
      metrics
    };
  }

  private extractFunctions(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const functionTypes = [
      'function_declaration',
      'method_definition',
      'arrow_function',
      'function_expression'
    ];

    for (const type of functionTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      
      for (const node of nodes) {
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
  }

  private extractClasses(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const classNodes = this.findNodesByType(ast, ['class_declaration']);
    
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
    const variableTypes = [
      'variable_declaration',
      'lexical_declaration',
      'assignment_expression'
    ];

    for (const type of variableTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      
      for (const node of nodes) {
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
  }

  private extractInterfaces(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const interfaceNodes = this.findNodesByType(ast, ['interface_declaration']);
    
    for (const node of interfaceNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'interface',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractInterfaceSignature(node),
          documentation: this.extractComment(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractTypes(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    const typeNodes = this.findNodesByType(ast, ['type_alias_declaration']);
    
    for (const node of typeNodes) {
      const name = this.extractIdentifier(node);
      if (name) {
        const position = this.getNodePosition(node);
        elements.push({
          type: 'type',
          name,
          path: filePath,
          line: position.line,
          column: position.column,
          signature: this.extractTypeSignature(node),
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

  private extractImports(ast: ASTNode, imports: ImportInfo[]): void {
    const importNodes = this.findNodesByType(ast, [
      'import_statement',
      'import_declaration'
    ]);
    
    for (const node of importNodes) {
      const importInfo = this.extractImportInfo(node);
      if (importInfo) {
        imports.push(importInfo);
      }
    }
  }

  private extractExports(ast: ASTNode, exports: ExportInfo[]): void {
    const exportNodes = this.findNodesByType(ast, [
      'export_statement',
      'export_declaration',
      'export_named_statement'
    ]);
    
    for (const node of exportNodes) {
      const exportInfo = this.extractExportInfo(node);
      if (exportInfo) {
        exports.push(exportInfo);
      }
    }
  }

  private extractFunctionName(node: ASTNode): string | null {
    // For function declarations, look for the identifier
    const identifier = this.findNodesByType(node, ['identifier'])[0];
    if (identifier) {
      return identifier.text;
    }
    
    // For arrow functions and function expressions, look for variable name
    const parent = node.parent;
    if (parent && parent.type === 'variable_declarator') {
      return this.extractIdentifier(parent);
    }
    
    return null;
  }

  private extractVariableName(node: ASTNode): string | null {
    if (node.type === 'variable_declaration') {
      const declarators = this.findNodesByType(node, ['variable_declarator']);
      if (declarators.length > 0) {
        return this.extractIdentifier(declarators[0]);
      }
    } else if (node.type === 'assignment_expression') {
      const left = this.findNodesByType(node, ['identifier'])[0];
      if (left) {
        return left.text;
      }
    }
    
    return null;
  }

  private extractFunctionSignature(node: ASTNode): string | undefined {
    const paramList = this.findNodesByType(node, ['formal_parameters'])[0];
    if (paramList) {
      const params = this.extractParameters(node);
      const paramStr = params.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ');
      return `(${paramStr})`;
    }
    return undefined;
  }

  private extractClassSignature(node: ASTNode): string | undefined {
    const extendsClause = this.findNodesByType(node, ['extends_clause'])[0];
    if (extendsClause) {
      const superClass = this.extractIdentifier(extendsClause);
      if (superClass) {
        return `extends ${superClass}`;
      }
    }
    return undefined;
  }

  private extractVariableSignature(node: ASTNode): string | undefined {
    const typeAnnotation = this.findNodesByType(node, ['type_annotation'])[0];
    if (typeAnnotation) {
      return `: ${typeAnnotation.text}`;
    }
    return undefined;
  }

  private extractInterfaceSignature(node: ASTNode): string | undefined {
    const extendsClause = this.findNodesByType(node, ['extends_clause'])[0];
    if (extendsClause) {
      const superInterface = this.extractIdentifier(extendsClause);
      if (superInterface) {
        return `extends ${superInterface}`;
      }
    }
    return undefined;
  }

  private extractTypeSignature(node: ASTNode): string | undefined {
    const typeAnnotation = this.findNodesByType(node, ['type_annotation'])[0];
    if (typeAnnotation) {
      return `= ${typeAnnotation.text}`;
    }
    return undefined;
  }

  private extractEnumSignature(node: ASTNode): string | undefined {
    const enumMembers = this.findNodesByType(node, ['enum_member']);
    if (enumMembers.length > 0) {
      const values = enumMembers.map(member => this.extractIdentifier(member)).filter(Boolean);
      return `{ ${values.join(', ')} }`;
    }
    return undefined;
  }

  private extractVisibility(node: ASTNode): 'public' | 'private' | 'protected' | undefined {
    const modifiers = this.extractModifiers(node);
    if (modifiers.includes('private')) return 'private';
    if (modifiers.includes('protected')) return 'protected';
    if (modifiers.includes('public')) return 'public';
    return undefined;
  }

  private extractModifiers(node: ASTNode): string[] {
    const modifiers: string[] = [];
    const modifierNodes = this.findNodesByType(node, ['accessibility_modifier']);
    
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
    const typeAnnotation = this.findNodesByType(node, ['type_annotation'])[0];
    return typeAnnotation ? typeAnnotation.text : undefined;
  }

  private extractParameterDefault(node: ASTNode): string | undefined {
    const defaultNode = this.findNodesByType(node, ['default_value'])[0];
    return defaultNode ? defaultNode.text : undefined;
  }

  private extractReturnType(node: ASTNode): string | undefined {
    const returnType = this.findNodesByType(node, ['return_type'])[0];
    return returnType ? returnType.text : undefined;
  }

  private extractImportInfo(node: ASTNode): ImportInfo | null {
    const source = this.extractStringLiteral(node);
    if (!source) return null;

    const specifiers = this.findNodesByType(node, ['import_specifier']);
    const imports: string[] = [];
    let isDefault = false;
    let alias: string | undefined;

    for (const specifier of specifiers) {
      const imported = this.extractIdentifier(specifier);
      if (imported) {
        imports.push(imported);
      }
      
      // Check for default import
      if (specifier.type === 'import_default_specifier') {
        isDefault = true;
      }
      
      // Check for alias
      const aliasNode = this.findNodesByType(specifier, ['identifier'])[1];
      if (aliasNode) {
        alias = aliasNode.text;
      }
    }

    return {
      path: source,
      imports,
      isDefault,
      alias
    };
  }

  private extractExportInfo(node: ASTNode): ExportInfo | null {
    const name = this.extractIdentifier(node);
    if (!name) return null;

    const type = node.type.includes('default') ? 'default' : 'named';

    return {
      name,
      type,
      path: undefined
    };
  }

  private calculateMetrics(ast: ASTNode): FileMetrics {
    const lines = ast.endPosition.row - ast.startPosition.row + 1;
    const functions = this.findNodesByType(ast, [
      'function_declaration',
      'method_definition',
      'arrow_function',
      'function_expression'
    ]).length;
    const classes = this.findNodesByType(ast, ['class_declaration']).length;
    const variables = this.findNodesByType(ast, [
      'variable_declaration',
      'lexical_declaration',
      'assignment_expression'
    ]).length;
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
      'else_if_clause',
      'else_clause',
      'for_statement',
      'while_statement',
      'do_statement',
      'switch_statement',
      'case_clause',
      'default_clause',
      'try_statement',
      'catch_clause',
      'finally_clause',
      'conditional_expression',
      'logical_expression'
    ];
    
    for (const type of controlFlowTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      complexity += nodes.length;
    }
    
    return complexity;
  }
} 