import { ASTNode, CodeElement, FileIndex, ImportInfo, ExportInfo, FileMetrics, Parameter } from '../types/index.js';
import { BaseAnalyzer } from './languages/base-analyzer.js';
import { JavaScriptAnalyzer } from './languages/javascript-analyzer.js';
import { PythonAnalyzer } from './languages/python-analyzer.js';
import { RustAnalyzer } from './languages/rust-analyzer.js';
import { CAnalyzer } from './languages/c-analyzer.js';
import { CppAnalyzer } from './languages/cpp-analyzer.js';

export class ASTAnalyzer {
  private analyzers: Map<string, BaseAnalyzer> = new Map();

  constructor() {
    this.initializeAnalyzers();
  }

  private initializeAnalyzers(): void {
    this.analyzers.set('javascript', new JavaScriptAnalyzer());
    this.analyzers.set('typescript', new JavaScriptAnalyzer()); // TypeScript uses same analyzer
    this.analyzers.set('python', new PythonAnalyzer());
    this.analyzers.set('rust', new RustAnalyzer());
    this.analyzers.set('c', new CAnalyzer());
    this.analyzers.set('cpp', new CppAnalyzer());
  }

  async analyzeAST(ast: ASTNode, filePath: string, language: string): Promise<FileIndex> {
    const analyzer = this.analyzers.get(language);
    
    if (!analyzer) {
      // Fallback to basic analysis for unsupported languages
      return this.basicAnalysis(ast, filePath, language);
    }

    try {
      return analyzer.analyzeAST(ast, filePath);
    } catch (error) {
      console.warn(`Failed to analyze ${filePath} with ${language} analyzer:`, error);
      return this.basicAnalysis(ast, filePath, language);
    }
  }

  private basicAnalysis(ast: ASTNode, filePath: string, language: string): FileIndex {
    const elements: CodeElement[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    const dependencies: string[] = [];

    // Basic element extraction
    this.extractBasicElements(ast, filePath, elements);
    this.extractBasicImports(ast, imports);
    this.extractBasicExports(ast, exports);

    const metrics = this.calculateBasicMetrics(ast);

    return {
      path: filePath,
      language,
      elements,
      imports,
      exports,
      dependencies,
      metrics
    };
  }

  private extractBasicElements(ast: ASTNode, filePath: string, elements: CodeElement[]): void {
    // Extract functions
    const functionNodes = this.findNodesByType(ast, ['function', 'function_declaration', 'method_definition']);
    for (const node of functionNodes) {
      const name = this.extractFunctionName(node);
      if (name) {
        elements.push({
          type: 'function',
          name,
          path: filePath,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          signature: this.extractFunctionSignature(node),
          documentation: this.extractDocumentation(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node),
          parameters: this.extractParameters(node),
          returnType: this.extractReturnType(node)
        });
      }
    }

    // Extract classes
    const classNodes = this.findNodesByType(ast, ['class_declaration', 'class_definition']);
    for (const node of classNodes) {
      const name = this.extractClassName(node);
      if (name) {
        elements.push({
          type: 'class',
          name,
          path: filePath,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          signature: this.extractClassSignature(node),
          documentation: this.extractDocumentation(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }

    // Extract variables
    const variableNodes = this.findNodesByType(ast, ['variable_declaration', 'assignment_expression']);
    for (const node of variableNodes) {
      const name = this.extractVariableName(node);
      if (name) {
        elements.push({
          type: 'variable',
          name,
          path: filePath,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          signature: this.extractVariableSignature(node),
          documentation: this.extractDocumentation(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }

    // Extract interfaces
    const interfaceNodes = this.findNodesByType(ast, ['interface_declaration', 'interface_definition']);
    for (const node of interfaceNodes) {
      const name = this.extractInterfaceName(node);
      if (name) {
        elements.push({
          type: 'interface',
          name,
          path: filePath,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          signature: this.extractInterfaceSignature(node),
          documentation: this.extractDocumentation(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }

    // Extract types
    const typeNodes = this.findNodesByType(ast, ['type_alias_declaration', 'typedef_declaration']);
    for (const node of typeNodes) {
      const name = this.extractTypeName(node);
      if (name) {
        elements.push({
          type: 'type',
          name,
          path: filePath,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          signature: this.extractTypeSignature(node),
          documentation: this.extractDocumentation(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }

    // Extract enums
    const enumNodes = this.findNodesByType(ast, ['enum_declaration', 'enum_definition']);
    for (const node of enumNodes) {
      const name = this.extractEnumName(node);
      if (name) {
        elements.push({
          type: 'enum',
          name,
          path: filePath,
          line: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
          signature: this.extractEnumSignature(node),
          documentation: this.extractDocumentation(node),
          visibility: this.extractVisibility(node),
          modifiers: this.extractModifiers(node)
        });
      }
    }
  }

  private extractBasicImports(ast: ASTNode, imports: ImportInfo[]): void {
    const importNodes = this.findNodesByType(ast, ['import_statement', 'import_declaration', 'import_from_statement']);
    
    for (const node of importNodes) {
      const importInfo = this.extractImportInfo(node);
      if (importInfo) {
        imports.push(importInfo);
      }
    }
  }

  private extractBasicExports(ast: ASTNode, exports: ExportInfo[]): void {
    const exportNodes = this.findNodesByType(ast, ['export_statement', 'export_declaration', 'export_named_statement']);
    
    for (const node of exportNodes) {
      const exportInfo = this.extractExportInfo(node);
      if (exportInfo) {
        exports.push(exportInfo);
      }
    }
  }

  private calculateBasicMetrics(ast: ASTNode): FileMetrics {
    const lines = this.countLines(ast);
    const functions = this.findNodesByType(ast, ['function', 'function_declaration', 'method_definition']).length;
    const classes = this.findNodesByType(ast, ['class_declaration', 'class_definition']).length;
    const variables = this.findNodesByType(ast, ['variable_declaration', 'assignment_expression']).length;
    const complexity = this.calculateComplexity(ast);

    return {
      lines,
      functions,
      classes,
      variables,
      complexity
    };
  }

  // Helper methods for element extraction
  private findNodesByType(ast: ASTNode, types: string[]): ASTNode[] {
    const results: ASTNode[] = [];
    
    if (types.includes(ast.type)) {
      results.push(ast);
    }
    
    for (const child of ast.children) {
      results.push(...this.findNodesByType(child, types));
    }
    
    return results;
  }

  private extractFunctionName(node: ASTNode): string | null {
    // Look for identifier nodes in function declarations
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractClassName(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractVariableName(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractInterfaceName(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractTypeName(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractEnumName(node: ASTNode): string | null {
    const identifiers = this.findNodesByType(node, ['identifier', 'name']);
    return identifiers.length > 0 ? identifiers[0].text : null;
  }

  private extractFunctionSignature(node: ASTNode): string | undefined {
    // Extract the function signature including parameters
    const paramNodes = this.findNodesByType(node, ['parameter_list', 'parameters']);
    if (paramNodes.length > 0) {
      const params = this.extractParameters(node);
      const paramStr = params.map(p => `${p.name}${p.type ? ': ' + p.type : ''}`).join(', ');
      return `(${paramStr})`;
    }
    return undefined;
  }

  private extractClassSignature(node: ASTNode): string | undefined {
    // Extract class signature including inheritance
    const extendsNodes = this.findNodesByType(node, ['extends_clause', 'inheritance']);
    if (extendsNodes.length > 0) {
      return `extends ${extendsNodes[0].text}`;
    }
    return undefined;
  }

  private extractVariableSignature(node: ASTNode): string | undefined {
    // Extract variable type if available
    const typeNodes = this.findNodesByType(node, ['type_annotation', 'type']);
    if (typeNodes.length > 0) {
      return `: ${typeNodes[0].text}`;
    }
    return undefined;
  }

  private extractInterfaceSignature(node: ASTNode): string | undefined {
    // Extract interface signature
    const extendsNodes = this.findNodesByType(node, ['extends_clause']);
    if (extendsNodes.length > 0) {
      return `extends ${extendsNodes[0].text}`;
    }
    return undefined;
  }

  private extractTypeSignature(node: ASTNode): string | undefined {
    // Extract type definition
    const typeNodes = this.findNodesByType(node, ['type', 'type_annotation']);
    if (typeNodes.length > 0) {
      return `= ${typeNodes[0].text}`;
    }
    return undefined;
  }

  private extractEnumSignature(node: ASTNode): string | undefined {
    // Extract enum values
    const valueNodes = this.findNodesByType(node, ['enum_member', 'enum_value']);
    if (valueNodes.length > 0) {
      const values = valueNodes.map(n => n.text).join(', ');
      return `{ ${values} }`;
    }
    return undefined;
  }

  private extractDocumentation(node: ASTNode): string | undefined {
    // Look for comment nodes before the current node
    const commentNodes = this.findNodesByType(node, ['comment', 'block_comment', 'line_comment']);
    if (commentNodes.length > 0) {
      return commentNodes[0].text.trim();
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
    const modifierNodes = this.findNodesByType(node, ['modifier', 'accessibility_modifier']);
    
    for (const modifierNode of modifierNodes) {
      modifiers.push(modifierNode.text);
    }
    
    return modifiers;
  }

  private extractParameters(node: ASTNode): Parameter[] {
    const parameters: Parameter[] = [];
    const paramNodes = this.findNodesByType(node, ['parameter', 'parameter_declaration']);
    
    for (const paramNode of paramNodes) {
      const name = this.extractVariableName(paramNode);
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
    const typeNodes = this.findNodesByType(node, ['type_annotation', 'type']);
    return typeNodes.length > 0 ? typeNodes[0].text : undefined;
  }

  private extractParameterDefault(node: ASTNode): string | undefined {
    const defaultNodes = this.findNodesByType(node, ['default_value', 'initializer']);
    return defaultNodes.length > 0 ? defaultNodes[0].text : undefined;
  }

  private extractReturnType(node: ASTNode): string | undefined {
    const returnNodes = this.findNodesByType(node, ['return_type', 'type_annotation']);
    return returnNodes.length > 0 ? returnNodes[0].text : undefined;
  }

  private extractImportInfo(node: ASTNode): ImportInfo | null {
    const pathNodes = this.findNodesByType(node, ['string', 'string_literal']);
    const importNodes = this.findNodesByType(node, ['identifier', 'name']);
    
    if (pathNodes.length > 0) {
      const path = pathNodes[0].text.replace(/['"]/g, '');
      const imports = importNodes.map(n => n.text);
      
      return {
        path,
        imports,
        isDefault: node.type.includes('default'),
        alias: this.extractImportAlias(node)
      };
    }
    
    return null;
  }

  private extractImportAlias(node: ASTNode): string | undefined {
    const aliasNodes = this.findNodesByType(node, ['alias', 'as']);
    return aliasNodes.length > 0 ? aliasNodes[0].text : undefined;
  }

  private extractExportInfo(node: ASTNode): ExportInfo | null {
    const nameNodes = this.findNodesByType(node, ['identifier', 'name']);
    
    if (nameNodes.length > 0) {
      const name = nameNodes[0].text;
      const type = node.type.includes('default') ? 'default' : 'named';
      
      return {
        name,
        type,
        path: undefined
      };
    }
    
    return null;
  }

  private countLines(ast: ASTNode): number {
    return ast.endPosition.row - ast.startPosition.row + 1;
  }

  private calculateComplexity(ast: ASTNode): number {
    let complexity = 1;
    
    // Count control flow statements
    const controlFlowTypes = [
      'if_statement', 'else_if_clause', 'else_clause',
      'for_statement', 'while_statement', 'do_statement',
      'switch_statement', 'case_clause', 'default_clause',
      'try_statement', 'catch_clause', 'finally_clause',
      'conditional_expression', 'logical_expression'
    ];
    
    for (const type of controlFlowTypes) {
      const nodes = this.findNodesByType(ast, [type]);
      complexity += nodes.length;
    }
    
    return complexity;
  }
} 