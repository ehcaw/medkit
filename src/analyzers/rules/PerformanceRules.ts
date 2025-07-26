import * as ts from 'typescript';
import { BaseRule, Pattern, RuleMatch } from '../StaticAnalyzer.js';
import { ParsedFile } from '../../services/CodeParser.js';

export class ReactRerenderRule extends BaseRule {
  id = 'PERF001';
  name = 'Unnecessary React Re-renders';
  description = 'Detects React components that may cause unnecessary re-renders due to inline object/function creation';
  category = 'performance' as const;
  severity = 'medium' as const;
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /style\s*=\s*\{\s*\{[^}]*\}\s*\}/g,
      description: 'Inline style object in JSX',
      confidence: 0.7
    },
    {
      type: 'regex',
      value: /onClick\s*=\s*\{\s*\([^)]*\)\s*=>\s*\{/g,
      description: 'Inline arrow function in event handler',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /onChange\s*=\s*\{\s*\([^)]*\)\s*=>\s*\{/g,
      description: 'Inline arrow function in onChange handler',
      confidence: 0.8
    }
  ];

  analyze(file: ParsedFile): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const content = file.content;
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      if (pattern.type === 'regex') {
        const regex = pattern.value as RegExp;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = lines[lineNumber - 1];
          const columnStart = match.index - content.substring(0, match.index).lastIndexOf('\n') - 1;
          
          const location = this.createCodeLocation(
            file,
            lineNumber,
            lineNumber,
            Math.max(0, columnStart),
            Math.min(lineContent.length, columnStart + match[0].length),
            this.extractCodeSnippet(content, lineNumber, Math.min(lineNumber + 2, lines.length))
          );

          matches.push(this.createRuleMatch(
            pattern,
            location,
            pattern.confidence,
            `Performance issue: Unnecessary re-render due to ${pattern.description}`
          ));
        }
      }
    }

    return matches;
  }
}

export class LargeBundleRule extends BaseRule {
  id = 'PERF002';
  name = 'Large Bundle Size Indicators';
  description = 'Detects patterns that may lead to large bundle sizes, such as importing entire libraries';
  category = 'performance' as const;
  severity = 'medium' as const;
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /import\s+\*\s+as\s+\w+\s+from\s+['"`]lodash['"`]/g,
      description: 'Importing entire lodash library',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /import\s+\*\s+as\s+\w+\s+from\s+['"`]moment['"`]/g,
      description: 'Importing entire moment library',
      confidence: 0.9
    },
    {
      type: 'regex',
      value: /import\s+\*\s+as\s+\w+\s+from\s+['"`]date-fns['"`]/g,
      description: 'Importing entire date-fns library',
      confidence: 0.8
    }
  ];

  analyze(file: ParsedFile): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const content = file.content;
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      if (pattern.type === 'regex') {
        const regex = pattern.value as RegExp;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = lines[lineNumber - 1];
          const columnStart = match.index - content.substring(0, match.index).lastIndexOf('\n') - 1;
          
          const location = this.createCodeLocation(
            file,
            lineNumber,
            lineNumber,
            Math.max(0, columnStart),
            Math.min(lineContent.length, columnStart + match[0].length),
            this.extractCodeSnippet(content, lineNumber, Math.min(lineNumber + 2, lines.length))
          );

          matches.push(this.createRuleMatch(
            pattern,
            location,
            pattern.confidence,
            `Bundle size issue: ${pattern.description}`
          ));
        }
      }
    }

    return matches;
  }
}

export class MemoryLeakRule extends BaseRule {
  id = 'PERF003';
  name = 'Potential Memory Leaks';
  description = 'Detects patterns that may cause memory leaks, such as missing cleanup in useEffect';
  category = 'performance' as const;
  severity = 'high' as const;
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*setInterval[^}]*\}/g,
      description: 'setInterval in useEffect without cleanup',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*setTimeout[^}]*\}/g,
      description: 'setTimeout in useEffect without cleanup',
      confidence: 0.7
    },
    {
      type: 'regex',
      value: /addEventListener\s*\([^)]*\)/g,
      description: 'addEventListener without removeEventListener',
      confidence: 0.6
    }
  ];

  analyze(file: ParsedFile): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const content = file.content;
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      if (pattern.type === 'regex') {
        const regex = pattern.value as RegExp;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          // Check if cleanup is present
          const contextStart = Math.max(0, match.index - 500);
          const contextEnd = Math.min(content.length, match.index + match[0].length + 500);
          const context = content.substring(contextStart, contextEnd);
          
          // Skip if cleanup is present
          if (context.includes('clearInterval') || context.includes('clearTimeout') || context.includes('removeEventListener')) {
            continue;
          }

          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = lines[lineNumber - 1];
          const columnStart = match.index - content.substring(0, match.index).lastIndexOf('\n') - 1;
          
          const location = this.createCodeLocation(
            file,
            lineNumber,
            lineNumber,
            Math.max(0, columnStart),
            Math.min(lineContent.length, columnStart + match[0].length),
            this.extractCodeSnippet(content, lineNumber, Math.min(lineNumber + 2, lines.length))
          );

          matches.push(this.createRuleMatch(
            pattern,
            location,
            pattern.confidence,
            `Memory leak risk: ${pattern.description}`
          ));
        }
      }
    }

    return matches;
  }
}

export class ExpensiveOperationRule extends BaseRule {
  id = 'PERF004';
  name = 'Expensive Operations in Render';
  description = 'Detects expensive operations that should not be performed during render';
  category = 'performance' as const;
  severity = 'medium' as const;
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /\.map\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\.filter[^}]*\}/g,
      description: 'Nested array operations in render',
      confidence: 0.7
    },
    {
      type: 'regex',
      value: /JSON\.parse\s*\([^)]*\)/g,
      description: 'JSON.parse in render',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /\.sort\s*\(\s*\([^)]*\)\s*=>/g,
      description: 'Array sorting in render',
      confidence: 0.7
    }
  ];

  analyze(file: ParsedFile): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const content = file.content;
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      if (pattern.type === 'regex') {
        const regex = pattern.value as RegExp;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = lines[lineNumber - 1];
          const columnStart = match.index - content.substring(0, match.index).lastIndexOf('\n') - 1;
          
          const location = this.createCodeLocation(
            file,
            lineNumber,
            lineNumber,
            Math.max(0, columnStart),
            Math.min(lineContent.length, columnStart + match[0].length),
            this.extractCodeSnippet(content, lineNumber, Math.min(lineNumber + 2, lines.length))
          );

          matches.push(this.createRuleMatch(
            pattern,
            location,
            pattern.confidence,
            `Performance issue: Expensive operation in render - ${pattern.description}`
          ));
        }
      }
    }

    return matches;
  }
}

export class MissingMemoizationRule extends BaseRule {
  id = 'PERF005';
  name = 'Missing Memoization';
  description = 'Detects expensive computations that could benefit from memoization';
  category = 'performance' as const;
  severity = 'low' as const;
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /const\s+\w+\s*=\s*useMemo\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\.filter[^}]*\}/g,
      description: 'Filter operation that could be memoized',
      confidence: 0.6
    },
    {
      type: 'regex',
      value: /const\s+\w+\s*=\s*useMemo\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\.map[^}]*\}/g,
      description: 'Map operation that could be memoized',
      confidence: 0.6
    }
  ];

  analyze(file: ParsedFile): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const content = file.content;
    const lines = content.split('\n');

    // First, find expensive operations
    const expensiveOps = [
      { pattern: /\.filter\s*\(\s*\([^)]*\)\s*=>/g, name: 'filter operation' },
      { pattern: /\.map\s*\(\s*\([^)]*\)\s*=>/g, name: 'map operation' },
      { pattern: /\.reduce\s*\(\s*\([^)]*\)\s*=>/g, name: 'reduce operation' }
    ];

    for (const op of expensiveOps) {
      let match;
      while ((match = op.pattern.exec(content)) !== null) {
        // Check if this operation is already memoized
        const contextStart = Math.max(0, match.index - 200);
        const contextEnd = Math.min(content.length, match.index + match[0].length + 200);
        const context = content.substring(contextStart, contextEnd);
        
        // Skip if already memoized
        if (context.includes('useMemo') || context.includes('useCallback')) {
          continue;
        }

        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = lines[lineNumber - 1];
        const columnStart = match.index - content.substring(0, match.index).lastIndexOf('\n') - 1;
        
        const location = this.createCodeLocation(
          file,
          lineNumber,
          lineNumber,
          Math.max(0, columnStart),
          Math.min(lineContent.length, columnStart + match[0].length),
          this.extractCodeSnippet(content, lineNumber, Math.min(lineNumber + 2, lines.length))
        );

        matches.push(this.createRuleMatch(
          {
            type: 'regex',
            value: op.pattern,
            description: `Missing memoization for ${op.name}`,
            confidence: 0.6
          },
          location,
          0.6,
          `Performance optimization: Consider memoizing ${op.name}`
        ));
      }
    }

    return matches;
  }
}

export class InefficientCSSRule extends BaseRule {
  id = 'PERF006';
  name = 'Inefficient CSS Selectors';
  description = 'Detects CSS selectors that may cause performance issues';
  category = 'performance' as const;
  severity = 'low' as const;
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /[.#]\w+\s+[.#]\w+\s+[.#]\w+/g,
      description: 'Deep CSS selector nesting',
      confidence: 0.7
    },
    {
      type: 'regex',
      value: /[.#]\w+\s*>\s*[.#]\w+\s*>\s*[.#]\w+/g,
      description: 'Deep CSS child selector nesting',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /[.#]\w+\s*\[[^\]]*\]/g,
      description: 'CSS attribute selectors',
      confidence: 0.6
    }
  ];

  analyze(file: ParsedFile): RuleMatch[] {
    const matches: RuleMatch[] = [];
    const content = file.content;
    const lines = content.split('\n');

    for (const pattern of this.patterns) {
      if (pattern.type === 'regex') {
        const regex = pattern.value as RegExp;
        let match;
        
        while ((match = regex.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const lineContent = lines[lineNumber - 1];
          const columnStart = match.index - content.substring(0, match.index).lastIndexOf('\n') - 1;
          
          const location = this.createCodeLocation(
            file,
            lineNumber,
            lineNumber,
            Math.max(0, columnStart),
            Math.min(lineContent.length, columnStart + match[0].length),
            this.extractCodeSnippet(content, lineNumber, Math.min(lineNumber + 2, lines.length))
          );

          matches.push(this.createRuleMatch(
            pattern,
            location,
            pattern.confidence,
            `CSS performance issue: ${pattern.description}`
          ));
        }
      }
    }

    return matches;
  }
} 