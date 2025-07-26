import { glob } from 'glob';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { FileInfo, ScanOptions } from '../types/index.js';

export class FileScanner {
  private defaultIgnorePatterns = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/.cache/**',
    '**/coverage/**',
    '**/*.log',
    '**/*.lock',
    '**/package-lock.json',
    '**/yarn.lock',
    '**/pnpm-lock.yaml'
  ];

  async scanDirectory(rootPath: string, options: ScanOptions = {}): Promise<FileInfo[]> {
    const {
      ignorePatterns = [],
      maxFileSize = 10 * 1024 * 1024, // 10MB
      includeHidden = false,
      parallel = true,
      maxWorkers = 4
    } = options;

    const allIgnorePatterns = [...this.defaultIgnorePatterns, ...ignorePatterns];
    
    if (!includeHidden) {
      allIgnorePatterns.push('**/.*/**');
    }

    const patterns = [
      '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
      '**/*.py', '**/*.pyw',
      '**/*.rs',
      '**/*.go',
      '**/*.c', '**/*.cpp', '**/*.cc', '**/*.cxx', '**/*.h', '**/*.hpp',
      '**/*.java',
      '**/*.rb',
      '**/*.php',
      '**/*.swift',
      '**/*.kt',
      '**/*.scala',
      '**/*.hs',
      '**/*.ml', '**/*.mli',
      '**/*.clj',
      '**/*.rkt',
      '**/*.dart',
      '**/*.nim',
      '**/*.zig',
      '**/*.v',
      '**/*.f90', '**/*.f95',
      '**/*.m', '**/*.mm',
      '**/*.cs',
      '**/*.vb',
      '**/*.pas',
      '**/*.pl', '**/*.pm',
      '**/*.sh', '**/*.bash', '**/*.zsh',
      '**/*.ps1',
      '**/*.bat', '**/*.cmd',
      '**/*.sql',
      '**/*.r',
      '**/*.jl',
      '**/*.d',
      '**/*.lua',
      '**/*.tcl',
      '**/*.awk',
      '**/*.sed',
      '**/*.yaml', '**/*.yml',
      '**/*.json',
      '**/*.toml',
      '**/*.ini', '**/*.cfg',
      '**/*.md', '**/*.markdown',
      '**/*.txt',
      '**/*.rst',
      '**/*.adoc',
      '**/*.tex',
      '**/*.html', '**/*.htm',
      '**/*.css', '**/*.scss', '**/*.sass', '**/*.less',
      '**/*.xml',
      '**/*.svg',
      '**/*.dockerfile', '**/Dockerfile*',
      '**/*.makefile', '**/Makefile*',
      '**/*.cmake', '**/CMakeLists.txt',
      '**/*.gradle',
      '**/*.maven', '**/pom.xml',
      '**/*.sbt',
      '**/*.cabal',
      '**/*.opam',
      '**/*.cargo',
      '**/*.composer',
      '**/*.gemfile',
      '**/*.requirements',
      '**/*.setup.py',
      '**/*.package.json',
      '**/*.bower.json',
      '**/*.bazel',
      '**/*.buck',
      '**/*.ninja',
      '**/*.meson',
      '**/*.conan',
      '**/*.vcpkg',
      '**/*.spack',
      '**/*.conda',
      '**/*.environment',
      '**/*.lockfile',
      '**/*.lock',
      '**/*.sum',
      '**/*.mod',
      '**/*.go.mod',
      '**/*.go.sum',
      '**/*.cargo.lock',
      '**/*.Cargo.lock',
      '**/*.composer.lock',
      '**/*.Gemfile.lock',
      '**/*.Pipfile.lock',
      '**/*.poetry.lock',
      '**/*.yarn.lock',
      '**/*.pnpm-lock.yaml',
      '**/*.bun.lockb',
      '**/*.npm-shrinkwrap.json'
    ];

    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: rootPath,
        ignore: allIgnorePatterns,
        absolute: true,
        nodir: true
      });
      files.push(...matches);
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(files)];

    if (parallel && uniqueFiles.length > 100) {
      return this.scanFilesParallel(uniqueFiles, maxFileSize, maxWorkers);
    } else {
      return this.scanFilesSequential(uniqueFiles, maxFileSize);
    }
  }

  private async scanFilesSequential(files: string[], maxFileSize: number): Promise<FileInfo[]> {
    const results: FileInfo[] = [];

    for (const file of files) {
      try {
        const fileInfo = await this.getFileInfo(file, maxFileSize);
        if (fileInfo) {
          results.push(fileInfo);
        }
      } catch (error) {
        console.warn(`Failed to scan file ${file}:`, error);
      }
    }

    return results;
  }

  private async scanFilesParallel(files: string[], maxFileSize: number, maxWorkers: number): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    const chunks = this.chunkArray(files, Math.ceil(files.length / maxWorkers));

    const promises = chunks.map(async (chunk) => {
      const chunkResults: FileInfo[] = [];
      for (const file of chunk) {
        try {
          const fileInfo = await this.getFileInfo(file, maxFileSize);
          if (fileInfo) {
            chunkResults.push(fileInfo);
          }
        } catch (error) {
          console.warn(`Failed to scan file ${file}:`, error);
        }
      }
      return chunkResults;
    });

    const chunkResults = await Promise.all(promises);
    return results.concat(...chunkResults);
  }

  private async getFileInfo(filePath: string, maxFileSize: number): Promise<FileInfo | null> {
    try {
      const stats = await stat(filePath);
      
      if (!stats.isFile()) {
        return null;
      }

      if (stats.size > maxFileSize) {
        console.warn(`File ${filePath} is too large (${stats.size} bytes), skipping`);
        return null;
      }

      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        language: undefined, // Will be detected later
        content: undefined // Will be loaded later if needed
      };
    } catch (error) {
      console.warn(`Failed to get file info for ${filePath}:`, error);
      return null;
    }
  }

  async getFileContent(filePath: string): Promise<string> {
    try {
      const content = await readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  shouldSkipFile(filePath: string): boolean {
    const skipPatterns = [
      /\.(log|tmp|temp|bak|backup|old|orig|rej)$/i,
      /\.(min|bundle)\.(js|css)$/i,
      /\.(map|d\.ts)$/i,
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.next/,
      /\.nuxt/,
      /\.cache/,
      /coverage/
    ];

    return skipPatterns.some(pattern => pattern.test(filePath));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
} 