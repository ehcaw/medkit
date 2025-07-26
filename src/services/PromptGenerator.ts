import { 
  VulnerabilityFinding, 
  LLMPrompt, 
  CodeLocation 
} from '../models/index.js';

export interface PromptTemplate {
  id: string;
  name: string;
  model: 'gpt-4' | 'claude' | 'generic';
  template: string;
  variables: string[];
}

export class PromptGenerator {
  private templates: Map<string, PromptTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  generatePrompt(finding: VulnerabilityFinding, model: 'gpt-4' | 'claude' | 'generic' = 'generic'): LLMPrompt {
    const template = this.getTemplateForFinding(finding, model);
    const prompt = this.renderTemplate(template, finding);

    return {
      id: this.generatePromptId(finding.id),
      findingId: finding.id,
      model,
      prompt,
      context: {
        code: finding.location.code,
        location: finding.location,
        issue: finding.description,
        recommendation: finding.recommendation
      },
      priority: this.calculatePriority(finding),
      createdAt: new Date()
    };
  }

  generatePrompts(findings: VulnerabilityFinding[], model: 'gpt-4' | 'claude' | 'generic' = 'generic'): LLMPrompt[] {
    return findings
      .map(finding => this.generatePrompt(finding, model))
      .sort((a, b) => b.priority - a.priority);
  }

  private getTemplateForFinding(finding: VulnerabilityFinding, model: 'gpt-4' | 'claude' | 'generic'): PromptTemplate {
    const templateKey = `${finding.type}-${finding.severity}-${model}`;
    
    // Try to find specific template
    let template = this.templates.get(templateKey);
    
    if (!template) {
      // Fallback to generic template for the type
      template = this.templates.get(`${finding.type}-${model}`) || 
                 this.templates.get(`generic-${model}`) ||
                 this.templates.get('generic-generic')!;
    }

    return template;
  }

  private renderTemplate(template: PromptTemplate, finding: VulnerabilityFinding): string {
    let prompt = template.template;

    // Replace variables in template
    const variables: Record<string, string> = {
      '{{TITLE}}': finding.title,
      '{{DESCRIPTION}}': finding.description,
      '{{SEVERITY}}': finding.severity,
      '{{CODE}}': finding.location.code,
      '{{FILE}}': finding.location.file,
      '{{LINE}}': finding.location.startLine.toString(),
      '{{RECOMMENDATION}}': finding.recommendation,
      '{{IMPACT}}': finding.impact,
      '{{CWE_ID}}': finding.cweId || 'N/A',
      '{{OWASP_CATEGORY}}': finding.owaspCategory || 'N/A'
    };

    // Add security-specific variables
    if (finding.type === 'security') {
      variables['{{EXPLOITABILITY}}'] = (finding as any).exploitability || 'unknown';
      variables['{{REMEDIATION}}'] = (finding as any).remediation || finding.recommendation;
    }

    // Add performance-specific variables
    if (finding.type === 'performance') {
      variables['{{METRIC}}'] = (finding as any).metric || 'N/A';
      variables['{{CURRENT_VALUE}}'] = (finding as any).currentValue?.toString() || 'N/A';
      variables['{{TARGET_VALUE}}'] = (finding as any).targetValue?.toString() || 'N/A';
      variables['{{IMPROVEMENT}}'] = (finding as any).improvement?.toString() || 'N/A';
    }

    // Replace all variables
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(key, 'g'), value);
    }

    return prompt;
  }

  private calculatePriority(finding: VulnerabilityFinding): number {
    const severityWeights = {
      critical: 100,
      high: 80,
      medium: 60,
      low: 40
    };

    const typeWeights = {
      security: 1.2,
      performance: 1.0
    };

    const basePriority = severityWeights[finding.severity];
    const typeMultiplier = typeWeights[finding.type];
    const confidenceBonus = finding.confidence * 10;

    return Math.round(basePriority * typeMultiplier + confidenceBonus);
  }

  private generatePromptId(findingId: string): string {
    const timestamp = Date.now();
    const hash = require('crypto').createHash('md5').update(`${findingId}-${timestamp}`).digest('hex');
    return `prompt-${hash.substring(0, 8)}`;
  }

  private loadDefaultTemplates(): void {
    // Security templates
    this.templates.set('security-critical-gpt-4', {
      id: 'security-critical-gpt-4',
      name: 'Critical Security Issue - GPT-4',
      model: 'gpt-4',
      template: `You are a security expert. I've identified a CRITICAL security vulnerability in my code that needs immediate attention.

**Issue:** {{TITLE}}
**Description:** {{DESCRIPTION}}
**Severity:** {{SEVERITY}}
**CWE ID:** {{CWE_ID}}
**OWASP Category:** {{OWASP_CATEGORY}}
**Exploitability:** {{EXPLOITABILITY}}

**Vulnerable Code:**
\`\`\`javascript
{{CODE}}
\`\`\`
**File:** {{FILE}}:{{LINE}}

**Impact:** {{IMPACT}}

Please provide:
1. A detailed explanation of why this is critical
2. Step-by-step remediation instructions
3. Secure code example that fixes this issue
4. Additional security measures to implement
5. Testing recommendations to verify the fix

Focus on immediate action and comprehensive security best practices.`,
      variables: ['TITLE', 'DESCRIPTION', 'SEVERITY', 'CODE', 'FILE', 'LINE', 'IMPACT', 'CWE_ID', 'OWASP_CATEGORY', 'EXPLOITABILITY']
    });

    this.templates.set('security-high-gpt-4', {
      id: 'security-high-gpt-4',
      name: 'High Security Issue - GPT-4',
      model: 'gpt-4',
      template: `You are a security expert. I've identified a HIGH severity security vulnerability in my code.

**Issue:** {{TITLE}}
**Description:** {{DESCRIPTION}}
**Severity:** {{SEVERITY}}
**CWE ID:** {{CWE_ID}}
**OWASP Category:** {{OWASP_CATEGORY}}

**Vulnerable Code:**
\`\`\`javascript
{{CODE}}
\`\`\`
**File:** {{FILE}}:{{LINE}}

**Impact:** {{IMPACT}}

Please provide:
1. Explanation of the security risk
2. Remediation steps with code examples
3. Best practices to prevent similar issues
4. Security testing recommendations

Focus on practical solutions and security best practices.`,
      variables: ['TITLE', 'DESCRIPTION', 'SEVERITY', 'CODE', 'FILE', 'LINE', 'IMPACT', 'CWE_ID', 'OWASP_CATEGORY']
    });

    // Performance templates
    this.templates.set('performance-high-gpt-4', {
      id: 'performance-high-gpt-4',
      name: 'High Performance Issue - GPT-4',
      model: 'gpt-4',
      template: `You are a performance optimization expert. I've identified a HIGH severity performance issue in my React/JavaScript code.

**Issue:** {{TITLE}}
**Description:** {{DESCRIPTION}}
**Severity:** {{SEVERITY}}
**Metric:** {{METRIC}}
**Current Value:** {{CURRENT_VALUE}}
**Target Value:** {{TARGET_VALUE}}
**Potential Improvement:** {{IMPROVEMENT}}%

**Problematic Code:**
\`\`\`javascript
{{CODE}}
\`\`\`
**File:** {{FILE}}:{{LINE}}

Please provide:
1. Detailed analysis of the performance impact
2. Step-by-step optimization instructions
3. Optimized code examples
4. Performance testing recommendations
5. Best practices to prevent similar issues

Focus on measurable improvements and React/JavaScript performance best practices.`,
      variables: ['TITLE', 'DESCRIPTION', 'SEVERITY', 'CODE', 'FILE', 'LINE', 'METRIC', 'CURRENT_VALUE', 'TARGET_VALUE', 'IMPROVEMENT']
    });

    // Claude templates
    this.templates.set('security-critical-claude', {
      id: 'security-critical-claude',
      name: 'Critical Security Issue - Claude',
      model: 'claude',
      template: `As a security expert, I need your help with a CRITICAL security vulnerability in my codebase.

**Vulnerability Details:**
- **Type:** {{TITLE}}
- **Description:** {{DESCRIPTION}}
- **Severity:** {{SEVERITY}}
- **CWE ID:** {{CWE_ID}}
- **OWASP Category:** {{OWASP_CATEGORY}}
- **Exploitability:** {{EXPLOITABILITY}}

**Vulnerable Code Location:**
File: {{FILE}}
Line: {{LINE}}

\`\`\`javascript
{{CODE}}
\`\`\`

**Potential Impact:** {{IMPACT}}

Please provide a comprehensive response including:
1. Risk assessment and urgency level
2. Detailed remediation strategy
3. Secure code implementation
4. Security testing approach
5. Prevention measures for future

This is a critical issue requiring immediate attention.`,
      variables: ['TITLE', 'DESCRIPTION', 'SEVERITY', 'CODE', 'FILE', 'LINE', 'IMPACT', 'CWE_ID', 'OWASP_CATEGORY', 'EXPLOITABILITY']
    });

    // Generic templates
    this.templates.set('generic-generic', {
      id: 'generic-generic',
      name: 'Generic Issue Template',
      model: 'generic',
      template: `I found a {{SEVERITY}} {{TYPE}} issue in my code that needs to be fixed.

**Issue:** {{TITLE}}
**Description:** {{DESCRIPTION}}

**Code:**
\`\`\`
{{CODE}}
\`\`\`
**Location:** {{FILE}}:{{LINE}}

**Recommendation:** {{RECOMMENDATION}}

Please help me fix this issue by providing:
1. Explanation of the problem
2. Step-by-step solution
3. Code example
4. Best practices to prevent this in the future`,
      variables: ['SEVERITY', 'TYPE', 'TITLE', 'DESCRIPTION', 'CODE', 'FILE', 'LINE', 'RECOMMENDATION']
    });

    // Add more templates for different combinations
    this.templates.set('security-medium-generic', {
      id: 'security-medium-generic',
      name: 'Medium Security Issue - Generic',
      model: 'generic',
      template: `I have a medium severity security issue in my code:

**Issue:** {{TITLE}}
**Description:** {{DESCRIPTION}}
**CWE ID:** {{CWE_ID}}

**Code:**
\`\`\`
{{CODE}}
\`\`\`
**File:** {{FILE}}:{{LINE}}

**Impact:** {{IMPACT}}

Please help me fix this security vulnerability.`,
      variables: ['TITLE', 'DESCRIPTION', 'CODE', 'FILE', 'LINE', 'IMPACT', 'CWE_ID']
    });

    this.templates.set('performance-medium-generic', {
      id: 'performance-medium-generic',
      name: 'Medium Performance Issue - Generic',
      model: 'generic',
      template: `I have a medium severity performance issue in my code:

**Issue:** {{TITLE}}
**Description:** {{DESCRIPTION}}

**Code:**
\`\`\`
{{CODE}}
\`\`\`
**File:** {{FILE}}:{{LINE}}

Please help me optimize this code for better performance.`,
      variables: ['TITLE', 'DESCRIPTION', 'CODE', 'FILE', 'LINE']
    });
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.set(`${template.id}`, template);
  }

  getTemplate(templateId: string): PromptTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  removeTemplate(templateId: string): void {
    this.templates.delete(templateId);
  }
} 