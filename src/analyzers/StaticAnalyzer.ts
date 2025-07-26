import * as ts from 'typescript';
import { 
  VulnerabilityFinding, 
  SecurityFinding, 
  PerformanceFinding, 
  CodeLocation 
} from '../models/index.js';
import { ParsedFile } from '../services/CodeParser.js';

export interface Rule {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  patterns: Pattern[];
  cweId?: string;
  owaspCategory?: string;
}

export interface Pattern {
  type: 'regex' | 'ast' | 'semantic';
  value: string | RegExp;
  description: string;
  confidence: number;
}

export interface RuleMatch {
  rule: Rule;
  pattern: Pattern;
  location: CodeLocation;
  confidence: number;
  context: string;
}

export interface AnalysisResult {
  findings: VulnerabilityFinding[];
  summary: {
    totalFindings: number;
    securityFindings: number;
    performanceFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  metadata: {
    rulesApplied: number;
    filesAnalyzed: number;
    analysisTime: number;
  };
}

export abstract class BaseRule {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract category: 'security' | 'performance';
  abstract severity: 'critical' | 'high' | 'medium' | 'low';
  abstract patterns: Pattern[];
  cweId?: string;
  owaspCategory?: string;

  enabled: boolean = true;

  abstract analyze(file: ParsedFile): RuleMatch[];

  protected createRuleMatch(
    pattern: Pattern,
    location: CodeLocation,
    confidence: number,
    context: string
  ): RuleMatch {
    return {
      rule: this.toRule(),
      pattern,
      location,
      confidence,
      context
    };
  }

  protected createCodeLocation(
    file: ParsedFile,
    startLine: number,
    endLine: number,
    startColumn: number,
    endColumn: number,
    code: string
  ): CodeLocation {
    return {
      file: file.path,
      startLine,
      endLine,
      startColumn,
      endColumn,
      code
    };
  }

  protected extractCodeSnippet(content: string, startLine: number, endLine: number): string {
    const lines = content.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  toRule(): Rule {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      severity: this.severity,
      enabled: this.enabled,
      patterns: this.patterns,
      cweId: this.cweId,
      owaspCategory: this.owaspCategory
    };
  }
}

export class StaticAnalyzer {
  private rules: BaseRule[] = [];
  private enabledRules: BaseRule[] = [];

  constructor() {
    this.loadDefaultRules();
  }

  addRule(rule: BaseRule): void {
    this.rules.push(rule);
    if (rule.enabled) {
      this.enabledRules.push(rule);
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    this.enabledRules = this.enabledRules.filter(rule => rule.id !== ruleId);
  }

  enableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule && !rule.enabled) {
      rule.enabled = true;
      this.enabledRules.push(rule);
    }
  }

  disableRule(ruleId: string): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule && rule.enabled) {
      rule.enabled = false;
      this.enabledRules = this.enabledRules.filter(r => r.id !== ruleId);
    }
  }

  async analyzeFile(file: ParsedFile): Promise<VulnerabilityFinding[]> {
    const startTime = Date.now();
    const findings: VulnerabilityFinding[] = [];

    for (const rule of this.enabledRules) {
      try {
        const matches = rule.analyze(file);
        
        for (const match of matches) {
          const finding = this.createFinding(match, file);
          if (finding) {
            findings.push(finding);
          }
        }
      } catch (error) {
        console.warn(`Error applying rule ${rule.id} to ${file.path}:`, error);
      }
    }

    return findings;
  }

  async analyzeFiles(files: ParsedFile[]): Promise<AnalysisResult> {
    const startTime = Date.now();
    const allFindings: VulnerabilityFinding[] = [];

    for (const file of files) {
      const findings = await this.analyzeFile(file);
      allFindings.push(...findings);
    }

    const analysisTime = Date.now() - startTime;
    const summary = this.calculateSummary(allFindings);

    return {
      findings: allFindings,
      summary,
      metadata: {
        rulesApplied: this.enabledRules.length,
        filesAnalyzed: files.length,
        analysisTime
      }
    };
  }

  private createFinding(match: RuleMatch, file: ParsedFile): VulnerabilityFinding | null {
    const { rule, location, confidence, context } = match;

    const baseFinding = {
      id: this.generateFindingId(rule.id, file.path),
      type: rule.category,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      location,
      recommendation: this.generateRecommendation(rule, context),
      impact: this.generateImpact(rule),
      confidence: Math.min(confidence, 1.0),
      tags: [rule.category, rule.severity],
      createdAt: new Date()
    };

    if (rule.category === 'security') {
      return {
        ...baseFinding,
        type: 'security',
        cweId: rule.cweId || 'CWE-000',
        owaspCategory: rule.owaspCategory || 'A01:2021',
        exploitability: this.calculateExploitability(rule.severity),
        remediation: this.generateRemediation(rule, context)
      } as SecurityFinding;
    } else {
      return {
        ...baseFinding,
        type: 'performance',
        metric: this.extractMetric(context),
        currentValue: this.extractCurrentValue(context),
        targetValue: this.extractTargetValue(context),
        improvement: this.calculateImprovement(context)
      } as PerformanceFinding;
    }
  }

  private generateFindingId(ruleId: string, filePath: string): string {
    const timestamp = Date.now();
    const hash = require('crypto').createHash('md5').update(`${ruleId}-${filePath}-${timestamp}`).digest('hex');
    return `${ruleId}-${hash.substring(0, 8)}`;
  }

  private generateRecommendation(rule: Rule, context: string): string {
    // This would be enhanced with more sophisticated recommendation generation
    return `Fix the ${rule.name.toLowerCase()} issue by following security best practices.`;
  }

  private generateImpact(rule: Rule): string {
    const impacts = {
      critical: 'This vulnerability could lead to complete system compromise.',
      high: 'This vulnerability could lead to significant data loss or system access.',
      medium: 'This vulnerability could lead to limited data exposure or system instability.',
      low: 'This vulnerability has minimal impact but should be addressed.'
    };
    return impacts[rule.severity] || impacts.low;
  }

  private calculateExploitability(severity: string): 'high' | 'medium' | 'low' {
    const mapping: Record<string, 'high' | 'medium' | 'low'> = {
      critical: 'high',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    return mapping[severity] || 'low';
  }

  private generateRemediation(rule: Rule, context: string): string {
    // This would be enhanced with specific remediation steps
    return `Implement proper input validation and sanitization to prevent ${rule.name.toLowerCase()}.`;
  }

  private extractMetric(context: string): string | undefined {
    // Extract performance metric from context
    const metricMatch = context.match(/(?:performance|metric|score):\s*(\w+)/i);
    return metricMatch ? metricMatch[1] : undefined;
  }

  private extractCurrentValue(context: string): number | undefined {
    // Extract current performance value from context
    const valueMatch = context.match(/(?:current|value):\s*(\d+(?:\.\d+)?)/i);
    return valueMatch ? parseFloat(valueMatch[1]) : undefined;
  }

  private extractTargetValue(context: string): number | undefined {
    // Extract target performance value from context
    const targetMatch = context.match(/(?:target|goal):\s*(\d+(?:\.\d+)?)/i);
    return targetMatch ? parseFloat(targetMatch[1]) : undefined;
  }

  private calculateImprovement(context: string): number | undefined {
    const current = this.extractCurrentValue(context);
    const target = this.extractTargetValue(context);
    
    if (current && target && current > 0) {
      return Math.round(((target - current) / current) * 100);
    }
    return undefined;
  }

  private calculateSummary(findings: VulnerabilityFinding[]) {
    const summary = {
      totalFindings: findings.length,
      securityFindings: 0,
      performanceFindings: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0
    };

    for (const finding of findings) {
      if (finding.type === 'security') {
        summary.securityFindings++;
      } else {
        summary.performanceFindings++;
      }

      switch (finding.severity) {
        case 'critical':
          summary.criticalCount++;
          break;
        case 'high':
          summary.highCount++;
          break;
        case 'medium':
          summary.mediumCount++;
          break;
        case 'low':
          summary.lowCount++;
          break;
      }
    }

    return summary;
  }

  private loadDefaultRules(): void {
    // This will be populated with default security and performance rules
    // Rules will be loaded from separate rule files
  }

  getRules(): Rule[] {
    return this.rules.map(rule => rule.toRule());
  }

  getEnabledRules(): Rule[] {
    return this.enabledRules.map(rule => rule.toRule());
  }

  getRuleById(ruleId: string): Rule | undefined {
    const rule = this.rules.find(r => r.id === ruleId);
    return rule ? rule.toRule() : undefined;
  }
} 