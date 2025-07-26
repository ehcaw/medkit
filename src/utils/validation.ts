import { 
  VulnerabilityFinding, 
  ScanRequest, 
  ScanOptions, 
  CodeLocation,
  SecurityFinding,
  PerformanceFinding 
} from '../models/index.js';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DataValidator {
  static validateCodeLocation(location: any): location is CodeLocation {
    if (!location || typeof location !== 'object') {
      throw new ValidationError('CodeLocation must be an object');
    }

    if (typeof location.file !== 'string' || !location.file.trim()) {
      throw new ValidationError('CodeLocation.file must be a non-empty string', 'file');
    }

    if (typeof location.startLine !== 'number' || location.startLine < 1) {
      throw new ValidationError('CodeLocation.startLine must be a positive number', 'startLine');
    }

    if (typeof location.endLine !== 'number' || location.endLine < location.startLine) {
      throw new ValidationError('CodeLocation.endLine must be >= startLine', 'endLine');
    }

    if (typeof location.startColumn !== 'number' || location.startColumn < 0) {
      throw new ValidationError('CodeLocation.startColumn must be a non-negative number', 'startColumn');
    }

    if (typeof location.endColumn !== 'number' || location.endColumn < 0) {
      throw new ValidationError('CodeLocation.endColumn must be a non-negative number', 'endColumn');
    }

    if (typeof location.code !== 'string') {
      throw new ValidationError('CodeLocation.code must be a string', 'code');
    }

    return true;
  }

  static validateVulnerabilityFinding(finding: any): finding is VulnerabilityFinding {
    if (!finding || typeof finding !== 'object') {
      throw new ValidationError('VulnerabilityFinding must be an object');
    }

    if (typeof finding.id !== 'string' || !finding.id.trim()) {
      throw new ValidationError('VulnerabilityFinding.id must be a non-empty string', 'id');
    }

    if (!['security', 'performance'].includes(finding.type)) {
      throw new ValidationError('VulnerabilityFinding.type must be "security" or "performance"', 'type');
    }

    if (!['critical', 'high', 'medium', 'low'].includes(finding.severity)) {
      throw new ValidationError('VulnerabilityFinding.severity must be critical, high, medium, or low', 'severity');
    }

    if (typeof finding.title !== 'string' || !finding.title.trim()) {
      throw new ValidationError('VulnerabilityFinding.title must be a non-empty string', 'title');
    }

    if (typeof finding.description !== 'string' || !finding.description.trim()) {
      throw new ValidationError('VulnerabilityFinding.description must be a non-empty string', 'description');
    }

    this.validateCodeLocation(finding.location);

    if (typeof finding.recommendation !== 'string' || !finding.recommendation.trim()) {
      throw new ValidationError('VulnerabilityFinding.recommendation must be a non-empty string', 'recommendation');
    }

    if (typeof finding.impact !== 'string' || !finding.impact.trim()) {
      throw new ValidationError('VulnerabilityFinding.impact must be a non-empty string', 'impact');
    }

    if (typeof finding.confidence !== 'number' || finding.confidence < 0 || finding.confidence > 1) {
      throw new ValidationError('VulnerabilityFinding.confidence must be a number between 0 and 1', 'confidence');
    }

    if (!Array.isArray(finding.tags) || !finding.tags.every((tag: any) => typeof tag === 'string')) {
      throw new ValidationError('VulnerabilityFinding.tags must be an array of strings', 'tags');
    }

    if (!(finding.createdAt instanceof Date)) {
      throw new ValidationError('VulnerabilityFinding.createdAt must be a Date object', 'createdAt');
    }

    return true;
  }

  static validateSecurityFinding(finding: any): finding is SecurityFinding {
    this.validateVulnerabilityFinding(finding);

    if (finding.type !== 'security') {
      throw new ValidationError('SecurityFinding.type must be "security"', 'type');
    }

    if (typeof finding.cweId !== 'string' || !finding.cweId.trim()) {
      throw new ValidationError('SecurityFinding.cweId must be a non-empty string', 'cweId');
    }

    if (typeof finding.owaspCategory !== 'string' || !finding.owaspCategory.trim()) {
      throw new ValidationError('SecurityFinding.owaspCategory must be a non-empty string', 'owaspCategory');
    }

    if (!['high', 'medium', 'low'].includes(finding.exploitability)) {
      throw new ValidationError('SecurityFinding.exploitability must be high, medium, or low', 'exploitability');
    }

    if (typeof finding.remediation !== 'string' || !finding.remediation.trim()) {
      throw new ValidationError('SecurityFinding.remediation must be a non-empty string', 'remediation');
    }

    return true;
  }

  static validatePerformanceFinding(finding: any): finding is PerformanceFinding {
    this.validateVulnerabilityFinding(finding);

    if (finding.type !== 'performance') {
      throw new ValidationError('PerformanceFinding.type must be "performance"', 'type');
    }

    if (finding.metric !== undefined && typeof finding.metric !== 'string') {
      throw new ValidationError('PerformanceFinding.metric must be a string if provided', 'metric');
    }

    if (finding.currentValue !== undefined && typeof finding.currentValue !== 'number') {
      throw new ValidationError('PerformanceFinding.currentValue must be a number if provided', 'currentValue');
    }

    if (finding.targetValue !== undefined && typeof finding.targetValue !== 'number') {
      throw new ValidationError('PerformanceFinding.targetValue must be a number if provided', 'targetValue');
    }

    if (finding.improvement !== undefined && (typeof finding.improvement !== 'number' || finding.improvement < 0)) {
      throw new ValidationError('PerformanceFinding.improvement must be a non-negative number if provided', 'improvement');
    }

    return true;
  }

  static validateScanOptions(options: any): options is ScanOptions {
    if (!options || typeof options !== 'object') {
      throw new ValidationError('ScanOptions must be an object');
    }

    if (typeof options.includeSecurity !== 'boolean') {
      throw new ValidationError('ScanOptions.includeSecurity must be a boolean', 'includeSecurity');
    }

    if (typeof options.includePerformance !== 'boolean') {
      throw new ValidationError('ScanOptions.includePerformance must be a boolean', 'includePerformance');
    }

    if (typeof options.includeReactScan !== 'boolean') {
      throw new ValidationError('ScanOptions.includeReactScan must be a boolean', 'includeReactScan');
    }

    if (options.maxFileSize !== undefined && (typeof options.maxFileSize !== 'number' || options.maxFileSize <= 0)) {
      throw new ValidationError('ScanOptions.maxFileSize must be a positive number if provided', 'maxFileSize');
    }

    if (options.ignorePatterns !== undefined) {
      if (!Array.isArray(options.ignorePatterns) || !options.ignorePatterns.every((pattern: any) => typeof pattern === 'string')) {
        throw new ValidationError('ScanOptions.ignorePatterns must be an array of strings if provided', 'ignorePatterns');
      }
    }

    if (options.customRules !== undefined) {
      if (!Array.isArray(options.customRules) || !options.customRules.every((rule: any) => typeof rule === 'string')) {
        throw new ValidationError('ScanOptions.customRules must be an array of strings if provided', 'customRules');
      }
    }

    if (options.llmModel !== undefined && !['gpt-4', 'claude', 'generic'].includes(options.llmModel)) {
      throw new ValidationError('ScanOptions.llmModel must be gpt-4, claude, or generic if provided', 'llmModel');
    }

    if (typeof options.generatePrompts !== 'boolean') {
      throw new ValidationError('ScanOptions.generatePrompts must be a boolean', 'generatePrompts');
    }

    if (typeof options.generateDocumentation !== 'boolean') {
      throw new ValidationError('ScanOptions.generateDocumentation must be a boolean', 'generateDocumentation');
    }

    if (options.exportFormat !== undefined && !['json', 'pdf', 'markdown', 'html'].includes(options.exportFormat)) {
      throw new ValidationError('ScanOptions.exportFormat must be json, pdf, markdown, or html if provided', 'exportFormat');
    }

    return true;
  }

  static validateScanRequest(request: any): request is ScanRequest {
    if (!request || typeof request !== 'object') {
      throw new ValidationError('ScanRequest must be an object');
    }

    if (typeof request.id !== 'string' || !request.id.trim()) {
      throw new ValidationError('ScanRequest.id must be a non-empty string', 'id');
    }

    if (!['file', 'url', 'code'].includes(request.source)) {
      throw new ValidationError('ScanRequest.source must be file, url, or code', 'source');
    }

    if (typeof request.input !== 'string' || !request.input.trim()) {
      throw new ValidationError('ScanRequest.input must be a non-empty string', 'input');
    }

    this.validateScanOptions(request.options);

    if (request.userId !== undefined && (typeof request.userId !== 'string' || !request.userId.trim())) {
      throw new ValidationError('ScanRequest.userId must be a non-empty string if provided', 'userId');
    }

    if (!(request.createdAt instanceof Date)) {
      throw new ValidationError('ScanRequest.createdAt must be a Date object', 'createdAt');
    }

    return true;
  }

  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }

    // Remove null bytes and other control characters
    let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalize line endings
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Limit length to prevent DoS
    if (sanitized.length > 10 * 1024 * 1024) { // 10MB limit
      throw new ValidationError('Input exceeds maximum allowed size of 10MB');
    }

    return sanitized;
  }

  static validateFilePath(filePath: string): boolean {
    if (typeof filePath !== 'string' || !filePath.trim()) {
      return false;
    }

    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('//')) {
      return false;
    }

    // Check for absolute paths (security measure)
    if (filePath.startsWith('/') || filePath.match(/^[A-Za-z]:/)) {
      return false;
    }

    return true;
  }

  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
} 