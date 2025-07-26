export interface Position {
  line: number;
  column: number;
}

export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  code: string;
}

export interface VulnerabilityFinding {
  id: string;
  type: 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  location: CodeLocation;
  cweId?: string;
  owaspCategory?: string;
  recommendation: string;
  impact: string;
  confidence: number; // 0-1
  tags: string[];
  createdAt: Date;
}

export interface PerformanceFinding extends VulnerabilityFinding {
  type: 'performance';
  metric?: string;
  currentValue?: number;
  targetValue?: number;
  improvement?: number; // percentage
}

export interface SecurityFinding extends VulnerabilityFinding {
  type: 'security';
  cweId: string;
  owaspCategory: string;
  exploitability: 'high' | 'medium' | 'low';
  remediation: string;
}

export interface ScanRequest {
  id: string;
  source: 'file' | 'url' | 'code';
  input: string; // file path, URL, or code content
  options: ScanOptions;
  userId?: string;
  createdAt: Date;
}

export interface ScanOptions {
  includeSecurity: boolean;
  includePerformance: boolean;
  includeReactScan: boolean;
  maxFileSize?: number;
  ignorePatterns?: string[];
  customRules?: string[];
  llmModel?: 'gpt-4' | 'claude' | 'generic';
  generatePrompts: boolean;
  generateDocumentation: boolean;
  exportFormat?: 'json' | 'pdf' | 'markdown' | 'html';
}

export interface ScanResult {
  id: string;
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  findings: VulnerabilityFinding[];
  summary: ScanSummary;
  metadata: ScanMetadata;
  prompts?: LLMPrompt[];
  documentation?: DocumentationSuggestion[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface ScanSummary {
  totalFindings: number;
  securityFindings: number;
  performanceFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  filesScanned: number;
  linesOfCode: number;
  scanDuration: number; // milliseconds
}

export interface ScanMetadata {
  files: string[];
  languages: string[];
  frameworks: string[];
  dependencies: string[];
  totalSize: number;
}

export interface LLMPrompt {
  id: string;
  findingId: string;
  model: string;
  prompt: string;
  context: {
    code: string;
    location: CodeLocation;
    issue: string;
    recommendation: string;
  };
  priority: number;
  createdAt: Date;
}

export interface DocumentationSuggestion {
  id: string;
  type: 'component' | 'function' | 'security' | 'performance';
  target: string; // component/function name or file
  suggestion: string;
  template?: string;
  priority: number;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  subscription: SubscriptionTier;
  usage: UsageStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionTier {
  type: 'free' | 'pro' | 'enterprise';
  limits: {
    scansPerMonth: number;
    maxFileSize: number;
    concurrentScans: number;
    retentionDays: number;
  };
  features: {
    browserMonitoring: boolean;
    customRules: boolean;
    priorityProcessing: boolean;
    apiAccess: boolean;
  };
}

export interface UsageStats {
  scansThisMonth: number;
  totalScans: number;
  lastScanAt?: Date;
  storageUsed: number;
}

export interface MonitoringConfig {
  id: string;
  userId: string;
  url: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
  lastCheck?: Date;
  webhooks?: string[];
  notifications?: NotificationConfig;
}

export interface NotificationConfig {
  email?: string[];
  slack?: string[];
  webhook?: string;
  criticalOnly: boolean;
} 