import * as ts from 'typescript';
import { BaseRule, Pattern, RuleMatch } from '../StaticAnalyzer.js';
import { ParsedFile } from '../../services/CodeParser.js';

export class XSSRule extends BaseRule {
  id = 'SEC001';
  name = 'Cross-Site Scripting (XSS)';
  description = 'Detects potential XSS vulnerabilities where user input is directly inserted into HTML without proper sanitization';
  category = 'security' as const;
  severity = 'high' as const;
  cweId = 'CWE-79';
  owaspCategory = 'A03:2021';
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /innerHTML\s*=\s*[^;]+(?:userInput|user_input|input|data|value)/gi,
      description: 'Direct assignment of user input to innerHTML',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /document\.write\s*\(\s*[^)]*(?:userInput|user_input|input|data|value)/gi,
      description: 'Direct use of user input in document.write',
      confidence: 0.9
    },
    {
      type: 'regex',
      value: /dangerouslySetInnerHTML\s*=\s*\{\s*[^}]+(?:userInput|user_input|input|data|value)/gi,
      description: 'React dangerouslySetInnerHTML with user input',
      confidence: 0.9
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
            `XSS vulnerability detected: ${match[0]}`
          ));
        }
      }
    }

    return matches;
  }
}

export class SQLInjectionRule extends BaseRule {
  id = 'SEC002';
  name = 'SQL Injection';
  description = 'Detects potential SQL injection vulnerabilities where user input is directly concatenated into SQL queries';
  category = 'security' as const;
  severity = 'critical' as const;
  cweId = 'CWE-89';
  owaspCategory = 'A03:2021';
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)\s+.*?\s+WHERE\s+.*?\$\{.*?\}/gi,
      description: 'Template literal with user input in SQL query',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /(?:SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)\s+.*?\s+WHERE\s+.*?\+.*?(?:userInput|user_input|input|data|value)/gi,
      description: 'String concatenation with user input in SQL query',
      confidence: 0.9
    },
    {
      type: 'regex',
      value: /query\s*\(\s*['"`].*?\$\{.*?\}.*?['"`]/gi,
      description: 'Database query with template literal',
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
            `SQL injection vulnerability detected: ${match[0]}`
          ));
        }
      }
    }

    return matches;
  }
}

export class CommandInjectionRule extends BaseRule {
  id = 'SEC003';
  name = 'Command Injection';
  description = 'Detects potential command injection vulnerabilities where user input is used in system commands';
  category = 'security' as const;
  severity = 'critical' as const;
  cweId = 'CWE-78';
  owaspCategory = 'A03:2021';
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /exec\s*\(\s*[^)]*(?:userInput|user_input|input|data|value)/gi,
      description: 'exec() with user input',
      confidence: 0.9
    },
    {
      type: 'regex',
      value: /spawn\s*\(\s*[^,]*,\s*\[[^\]]*(?:userInput|user_input|input|data|value)/gi,
      description: 'child_process.spawn with user input',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /execSync\s*\(\s*[^)]*(?:userInput|user_input|input|data|value)/gi,
      description: 'execSync() with user input',
      confidence: 0.9
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
            `Command injection vulnerability detected: ${match[0]}`
          ));
        }
      }
    }

    return matches;
  }
}

export class HardcodedSecretsRule extends BaseRule {
  id = 'SEC004';
  name = 'Hardcoded Secrets';
  description = 'Detects hardcoded passwords, API keys, and other sensitive information in code';
  category = 'security' as const;
  severity = 'high' as const;
  cweId = 'CWE-259';
  owaspCategory = 'A07:2021';
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /(?:password|passwd|pwd)\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi,
      description: 'Hardcoded password',
      confidence: 0.8
    },
    {
      type: 'regex',
      value: /(?:api_key|apikey|secret|token)\s*[:=]\s*['"`][^'"`]{16,}['"`]/gi,
      description: 'Hardcoded API key or secret',
      confidence: 0.9
    },
    {
      type: 'regex',
      value: /(?:private_key|privatekey)\s*[:=]\s*['"`]-----BEGIN PRIVATE KEY-----/gi,
      description: 'Hardcoded private key',
      confidence: 0.95
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
            `Hardcoded secret detected: ${match[0]}`
          ));
        }
      }
    }

    return matches;
  }
}

export class InsecureRandomRule extends BaseRule {
  id = 'SEC005';
  name = 'Insecure Random Number Generation';
  description = 'Detects use of Math.random() for security-sensitive operations instead of cryptographically secure random number generation';
  category = 'security' as const;
  severity = 'medium' as const;
  cweId = 'CWE-338';
  owaspCategory = 'A02:2021';
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /Math\.random\s*\(\s*\)/g,
      description: 'Use of Math.random()',
      confidence: 0.6
    },
    {
      type: 'regex',
      value: /Math\.floor\s*\(\s*Math\.random\s*\(\s*\)\s*\*\s*\d+\s*\)/g,
      description: 'Math.random() used for integer generation',
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
            `Insecure random number generation detected: ${match[0]}`
          ));
        }
      }
    }

    return matches;
  }
}

export class NoCSRFRule extends BaseRule {
  id = 'SEC006';
  name = 'Missing CSRF Protection';
  description = 'Detects forms and API endpoints that may be vulnerable to CSRF attacks due to missing CSRF tokens';
  category = 'security' as const;
  severity = 'medium' as const;
  cweId = 'CWE-352';
  owaspCategory = 'A01:2021';
  
  patterns: Pattern[] = [
    {
      type: 'regex',
      value: /<form[^>]*method\s*=\s*['"]post['"][^>]*>/gi,
      description: 'POST form without CSRF token',
      confidence: 0.5
    },
    {
      type: 'regex',
      value: /fetch\s*\(\s*[^,]*,\s*\{[^}]*method\s*:\s*['"]post['"][^}]*\}/gi,
      description: 'POST request without CSRF protection',
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
          // Check if CSRF token is present in the same context
          const contextStart = Math.max(0, match.index - 200);
          const contextEnd = Math.min(content.length, match.index + match[0].length + 200);
          const context = content.substring(contextStart, contextEnd);
          
          // Skip if CSRF token is present
          if (context.includes('csrf') || context.includes('xsrf') || context.includes('_token')) {
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
            `Missing CSRF protection detected: ${match[0]}`
          ));
        }
      }
    }

    return matches;
  }
} 