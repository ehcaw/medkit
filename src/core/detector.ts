import { extname, basename } from 'path';
import mime from 'mime-types';
import { LanguageInfo } from '../types/index.js';

export class LanguageDetector {
  private extensionMap: Map<string, string> = new Map([
    // JavaScript/TypeScript
    ['.js', 'javascript'],
    ['.jsx', 'javascript'],
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    ['.mjs', 'javascript'],
    ['.cjs', 'javascript'],
    
    // Python
    ['.py', 'python'],
    ['.pyw', 'python'],
    ['.pyi', 'python'],
    ['.pyx', 'python'],
    ['.pxd', 'python'],
    
    // Rust
    ['.rs', 'rust'],
    
    // Go
    ['.go', 'go'],
    
    // C/C++
    ['.c', 'c'],
    ['.cpp', 'cpp'],
    ['.cc', 'cpp'],
    ['.cxx', 'cpp'],
    ['.h', 'c'],
    ['.hpp', 'cpp'],
    ['.hxx', 'cpp'],
    
    // Java
    ['.java', 'java'],
    ['.class', 'java'],
    ['.jar', 'java'],
    
    // Ruby
    ['.rb', 'ruby'],
    ['.erb', 'ruby'],
    ['.rake', 'ruby'],
    ['.gemspec', 'ruby'],
    
    // PHP
    ['.php', 'php'],
    ['.phtml', 'php'],
    ['.php3', 'php'],
    ['.php4', 'php'],
    ['.php5', 'php'],
    ['.phps', 'php'],
    
    // Swift
    ['.swift', 'swift'],
    
    // Kotlin
    ['.kt', 'kotlin'],
    ['.kts', 'kotlin'],
    
    // Scala
    ['.scala', 'scala'],
    ['.sc', 'scala'],
    
    // Haskell
    ['.hs', 'haskell'],
    ['.lhs', 'haskell'],
    
    // OCaml
    ['.ml', 'ocaml'],
    ['.mli', 'ocaml'],
    
    // Clojure
    ['.clj', 'clojure'],
    ['.cljs', 'clojure'],
    ['.cljc', 'clojure'],
    
    // Racket
    ['.rkt', 'racket'],
    ['.rktl', 'racket'],
    
    // Dart
    ['.dart', 'dart'],
    
    // Nim
    ['.nim', 'nim'],
    
    // Zig
    ['.zig', 'zig'],
    
    // V
    ['.v', 'v'],
    
    // Fortran
    ['.f90', 'fortran'],
    ['.f95', 'fortran'],
    ['.f03', 'fortran'],
    ['.f08', 'fortran'],
    
    // Objective-C
    ['.m', 'objc'],
    ['.mm', 'objc'],
    
    // C#
    ['.cs', 'csharp'],
    
    // Visual Basic
    ['.vb', 'vb'],
    ['.vbs', 'vb'],
    
    // Pascal
    ['.pas', 'pascal'],
    ['.pp', 'pascal'],
    ['.p', 'pascal'],
    
    // Perl
    ['.pl', 'perl'],
    ['.pm', 'perl'],
    ['.t', 'perl'],
    
    // Shell scripts
    ['.sh', 'bash'],
    ['.bash', 'bash'],
    ['.zsh', 'bash'],
    ['.fish', 'bash'],
    ['.ksh', 'bash'],
    ['.csh', 'bash'],
    ['.tcsh', 'bash'],
    
    // PowerShell
    ['.ps1', 'powershell'],
    ['.psm1', 'powershell'],
    ['.psd1', 'powershell'],
    
    // Batch files
    ['.bat', 'batch'],
    ['.cmd', 'batch'],
    
    // SQL
    ['.sql', 'sql'],
    
    // R
    ['.r', 'r'],
    ['.R', 'r'],
    
    // Julia
    ['.jl', 'julia'],
    
    // D
    ['.d', 'd'],
    
    // Lua
    ['.lua', 'lua'],
    
    // Tcl
    ['.tcl', 'tcl'],
    ['.tk', 'tcl'],
    
    // Awk
    ['.awk', 'awk'],
    
    // Sed
    ['.sed', 'sed'],
    
    // Configuration files
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
    ['.json', 'json'],
    ['.toml', 'toml'],
    ['.ini', 'ini'],
    ['.cfg', 'ini'],
    ['.conf', 'ini'],
    
    // Documentation
    ['.md', 'markdown'],
    ['.markdown', 'markdown'],
    ['.txt', 'text'],
    ['.rst', 'rst'],
    ['.adoc', 'asciidoc'],
    ['.tex', 'latex'],
    
    // Web
    ['.html', 'html'],
    ['.htm', 'html'],
    ['.css', 'css'],
    ['.scss', 'scss'],
    ['.sass', 'sass'],
    ['.less', 'less'],
    ['.xml', 'xml'],
    ['.svg', 'svg'],
    
    // Build files
    ['.dockerfile', 'dockerfile'],
    ['.makefile', 'makefile'],
    ['.cmake', 'cmake'],
    ['.gradle', 'gradle'],
    ['.maven', 'maven'],
    ['.sbt', 'sbt'],
    ['.cabal', 'cabal'],
    ['.opam', 'opam'],
    ['.cargo', 'cargo'],
    ['.composer', 'composer'],
    ['.gemfile', 'gemfile'],
    ['.requirements', 'requirements'],
    ['.setup.py', 'setup.py'],
    ['.bower.json', 'bower'],
    ['.bazel', 'bazel'],
    ['.buck', 'buck'],
    ['.ninja', 'ninja'],
    ['.meson', 'meson'],
    ['.conan', 'conan'],
    ['.vcpkg', 'vcpkg'],
    ['.spack', 'spack'],
    ['.conda', 'conda'],
    ['.environment', 'environment'],
    ['.lockfile', 'lockfile'],
    ['.lock', 'lock'],
    ['.sum', 'sum'],
    ['.mod', 'mod'],
    ['.go.mod', 'go.mod'],
    ['.go.sum', 'go.sum'],
    ['.cargo.lock', 'cargo.lock'],
    ['.Cargo.lock', 'cargo.lock'],
    ['.composer.lock', 'composer.lock'],
    ['.Gemfile.lock', 'gemfile.lock'],
    ['.Pipfile.lock', 'pipfile.lock'],
    ['.poetry.lock', 'poetry.lock'],
    ['.yarn.lock', 'yarn.lock'],
    ['.pnpm-lock.yaml', 'pnpm.lock'],
    ['.bun.lockb', 'bun.lock'],
    ['.npm-shrinkwrap.json', 'npm.lock']
  ]);

  private filenameMap: Map<string, string> = new Map([
    ['Dockerfile', 'dockerfile'],
    ['Makefile', 'makefile'],
    ['CMakeLists.txt', 'cmake'],
    ['pom.xml', 'maven'],
    ['build.gradle', 'gradle'],
    ['build.sbt', 'sbt'],
    ['Cargo.toml', 'cargo'],
    ['composer.json', 'composer'],
    ['Gemfile', 'gemfile'],
    ['requirements.txt', 'requirements'],
    ['setup.py', 'setup.py'],
    ['package.json', 'package.json'],
    ['bower.json', 'bower'],
    ['BUILD', 'bazel'],
    ['BUCK', 'buck'],
    ['build.ninja', 'ninja'],
    ['meson.build', 'meson'],
    ['conanfile.txt', 'conan'],
    ['vcpkg.json', 'vcpkg'],
    ['spack.yaml', 'spack'],
    ['environment.yml', 'conda'],
    ['environment.yaml', 'conda'],
    ['Pipfile', 'pipfile'],
    ['pyproject.toml', 'pyproject'],
    ['poetry.lock', 'poetry.lock'],
    ['yarn.lock', 'yarn.lock'],
    ['pnpm-lock.yaml', 'pnpm.lock'],
    ['bun.lockb', 'bun.lock'],
    ['npm-shrinkwrap.json', 'npm.lock'],
    ['go.mod', 'go.mod'],
    ['go.sum', 'go.sum'],
    ['Cargo.lock', 'cargo.lock'],
    ['composer.lock', 'composer.lock'],
    ['Gemfile.lock', 'gemfile.lock'],
    ['Pipfile.lock', 'pipfile.lock'],
    ['poetry.lock', 'poetry.lock'],
    ['yarn.lock', 'yarn.lock'],
    ['pnpm-lock.yaml', 'pnpm.lock'],
    ['bun.lockb', 'bun.lock'],
    ['npm-shrinkwrap.json', 'npm.lock']
  ]);

  private shebangMap: Map<string, string> = new Map([
    ['#!/usr/bin/env python', 'python'],
    ['#!/usr/bin/env python3', 'python'],
    ['#!/usr/bin/python', 'python'],
    ['#!/usr/bin/python3', 'python'],
    ['#!/usr/bin/env node', 'javascript'],
    ['#!/usr/bin/node', 'javascript'],
    ['#!/usr/bin/env ruby', 'ruby'],
    ['#!/usr/bin/ruby', 'ruby'],
    ['#!/usr/bin/env perl', 'perl'],
    ['#!/usr/bin/perl', 'perl'],
    ['#!/usr/bin/env bash', 'bash'],
    ['#!/bin/bash', 'bash'],
    ['#!/usr/bin/env zsh', 'bash'],
    ['#!/bin/zsh', 'bash'],
    ['#!/usr/bin/env fish', 'bash'],
    ['#!/bin/fish', 'bash'],
    ['#!/usr/bin/env ksh', 'bash'],
    ['#!/bin/ksh', 'bash'],
    ['#!/usr/bin/env csh', 'bash'],
    ['#!/bin/csh', 'bash'],
    ['#!/usr/bin/env tcsh', 'bash'],
    ['#!/bin/tcsh', 'bash'],
    ['#!/usr/bin/env tclsh', 'tcl'],
    ['#!/usr/bin/tclsh', 'tcl'],
    ['#!/usr/bin/env wish', 'tcl'],
    ['#!/usr/bin/wish', 'tcl'],
    ['#!/usr/bin/env awk', 'awk'],
    ['#!/usr/bin/awk', 'awk'],
    ['#!/usr/bin/env sed', 'sed'],
    ['#!/usr/bin/sed', 'sed'],
    ['#!/usr/bin/env lua', 'lua'],
    ['#!/usr/bin/lua', 'lua'],
    ['#!/usr/bin/env lua5.1', 'lua'],
    ['#!/usr/bin/env lua5.2', 'lua'],
    ['#!/usr/bin/env lua5.3', 'lua'],
    ['#!/usr/bin/env lua5.4', 'lua'],
    ['#!/usr/bin/lua5.1', 'lua'],
    ['#!/usr/bin/lua5.2', 'lua'],
    ['#!/usr/bin/lua5.3', 'lua'],
    ['#!/usr/bin/lua5.4', 'lua'],
    ['#!/usr/bin/env php', 'php'],
    ['#!/usr/bin/php', 'php'],
    ['#!/usr/bin/env php5', 'php'],
    ['#!/usr/bin/env php7', 'php'],
    ['#!/usr/bin/env php8', 'php'],
    ['#!/usr/bin/php5', 'php'],
    ['#!/usr/bin/php7', 'php'],
    ['#!/usr/bin/php8', 'php'],
    ['#!/usr/bin/env R', 'r'],
    ['#!/usr/bin/R', 'r'],
    ['#!/usr/bin/env Rscript', 'r'],
    ['#!/usr/bin/Rscript', 'r'],
    ['#!/usr/bin/env julia', 'julia'],
    ['#!/usr/bin/julia', 'julia'],
    ['#!/usr/bin/env dmd', 'd'],
    ['#!/usr/bin/dmd', 'd'],
    ['#!/usr/bin/env ldc2', 'd'],
    ['#!/usr/bin/ldc2', 'd'],
    ['#!/usr/bin/env gdc', 'd'],
    ['#!/usr/bin/gdc', 'd'],
    ['#!/usr/bin/env nim', 'nim'],
    ['#!/usr/bin/nim', 'nim'],
    ['#!/usr/bin/env zig', 'zig'],
    ['#!/usr/bin/zig', 'zig'],
    ['#!/usr/bin/env v', 'v'],
    ['#!/usr/bin/v', 'v'],
    ['#!/usr/bin/env dart', 'dart'],
    ['#!/usr/bin/dart', 'dart'],
    ['#!/usr/bin/env swift', 'swift'],
    ['#!/usr/bin/swift', 'swift'],
    ['#!/usr/bin/env kotlin', 'kotlin'],
    ['#!/usr/bin/kotlin', 'kotlin'],
    ['#!/usr/bin/env scala', 'scala'],
    ['#!/usr/bin/scala', 'scala'],
    ['#!/usr/bin/env clojure', 'clojure'],
    ['#!/usr/bin/clojure', 'clojure'],
    ['#!/usr/bin/env racket', 'racket'],
    ['#!/usr/bin/racket', 'racket'],
    ['#!/usr/bin/env haskell', 'haskell'],
    ['#!/usr/bin/haskell', 'haskell'],
    ['#!/usr/bin/env ghc', 'haskell'],
    ['#!/usr/bin/ghc', 'haskell'],
    ['#!/usr/bin/env ocaml', 'ocaml'],
    ['#!/usr/bin/ocaml', 'ocaml'],
    ['#!/usr/bin/env fsharp', 'fsharp'],
    ['#!/usr/bin/fsharp', 'fsharp'],
    ['#!/usr/bin/env elixir', 'elixir'],
    ['#!/usr/bin/elixir', 'elixir'],
    ['#!/usr/bin/env erlang', 'erlang'],
    ['#!/usr/bin/erlang', 'erlang'],
    ['#!/usr/bin/env crystal', 'crystal'],
    ['#!/usr/bin/crystal', 'crystal'],
    ['#!/usr/bin/env nim', 'nim'],
    ['#!/usr/bin/nim', 'nim'],
    ['#!/usr/bin/env zig', 'zig'],
    ['#!/usr/bin/zig', 'zig'],
    ['#!/usr/bin/env v', 'v'],
    ['#!/usr/bin/v', 'v'],
    ['#!/usr/bin/env dart', 'dart'],
    ['#!/usr/bin/dart', 'dart'],
    ['#!/usr/bin/env swift', 'swift'],
    ['#!/usr/bin/swift', 'swift'],
    ['#!/usr/bin/env kotlin', 'kotlin'],
    ['#!/usr/bin/kotlin', 'kotlin'],
    ['#!/usr/bin/env scala', 'scala'],
    ['#!/usr/bin/scala', 'scala'],
    ['#!/usr/bin/env clojure', 'clojure'],
    ['#!/usr/bin/clojure', 'clojure'],
    ['#!/usr/bin/env racket', 'racket'],
    ['#!/usr/bin/racket', 'racket'],
    ['#!/usr/bin/env haskell', 'haskell'],
    ['#!/usr/bin/haskell', 'haskell'],
    ['#!/usr/bin/env ghc', 'haskell'],
    ['#!/usr/bin/ghc', 'haskell'],
    ['#!/usr/bin/env ocaml', 'ocaml'],
    ['#!/usr/bin/ocaml', 'ocaml'],
    ['#!/usr/bin/env fsharp', 'fsharp'],
    ['#!/usr/bin/fsharp', 'fsharp'],
    ['#!/usr/bin/env elixir', 'elixir'],
    ['#!/usr/bin/elixir', 'elixir'],
    ['#!/usr/bin/env erlang', 'erlang'],
    ['#!/usr/bin/erlang', 'erlang'],
    ['#!/usr/bin/env crystal', 'crystal']
  ]);

  detectLanguage(filePath: string, content?: string): LanguageInfo {
    const extension = extname(filePath).toLowerCase();
    const filename = basename(filePath);
    
    // Check filename first (for files like Dockerfile, Makefile, etc.)
    const filenameLanguage = this.filenameMap.get(filename);
    if (filenameLanguage) {
      return {
        name: filenameLanguage,
        confidence: 0.95,
        parser: this.getParserForLanguage(filenameLanguage)
      };
    }

    // Check file extension
    const extensionLanguage = this.extensionMap.get(extension);
    if (extensionLanguage) {
      return {
        name: extensionLanguage,
        confidence: 0.9,
        parser: this.getParserForLanguage(extensionLanguage)
      };
    }

    // Check shebang line if content is provided
    if (content) {
      const shebangLanguage = this.detectFromShebang(content);
      if (shebangLanguage) {
        return {
          name: shebangLanguage,
          confidence: 0.85,
          parser: this.getParserForLanguage(shebangLanguage)
        };
      }

      // Check MIME type
      const mimeType = mime.lookup(filePath);
      if (mimeType) {
        const mimeLanguage = this.detectFromMimeType(mimeType);
        if (mimeLanguage) {
          return {
            name: mimeLanguage,
            confidence: 0.7,
            parser: this.getParserForLanguage(mimeLanguage)
          };
        }
      }

      // Check content-based detection
      const contentLanguage = this.detectFromContent(content);
      if (contentLanguage) {
        return {
          name: contentLanguage,
          confidence: 0.6,
          parser: this.getParserForLanguage(contentLanguage)
        };
      }
    }

    // Default to text for unknown files
    return {
      name: 'text',
      confidence: 0.1,
      parser: undefined
    };
  }

  getSupportedLanguages(): string[] {
    return [
      'javascript', 'typescript', 'python', 'rust', 'go', 'c', 'cpp',
      'java', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'haskell',
      'ocaml', 'clojure', 'racket', 'dart', 'nim', 'zig', 'v',
      'fortran', 'objc', 'csharp', 'vb', 'pascal', 'perl', 'bash',
      'powershell', 'batch', 'sql', 'r', 'julia', 'd', 'lua', 'tcl',
      'awk', 'sed', 'yaml', 'json', 'toml', 'ini', 'markdown', 'text',
      'rst', 'asciidoc', 'latex', 'html', 'css', 'scss', 'sass', 'less',
      'xml', 'svg', 'dockerfile', 'makefile', 'cmake', 'gradle', 'maven',
      'sbt', 'cabal', 'opam', 'cargo', 'composer', 'gemfile', 'requirements',
      'setup.py', 'package.json', 'bower', 'bazel', 'buck', 'ninja', 'meson',
      'conan', 'vcpkg', 'spack', 'conda', 'environment', 'lockfile', 'lock',
      'sum', 'mod', 'go.mod', 'go.sum', 'cargo.lock', 'composer.lock',
      'gemfile.lock', 'pipfile.lock', 'poetry.lock', 'yarn.lock', 'pnpm.lock',
      'bun.lock', 'npm.lock'
    ];
  }

  isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language);
  }

  private detectFromShebang(content: string): string | null {
    const firstLine = content.split('\n')[0].trim();
    
    for (const [shebang, language] of this.shebangMap) {
      if (firstLine.startsWith(shebang)) {
        return language;
      }
    }
    
    return null;
  }

  private detectFromMimeType(mimeType: string): string | null {
    const mimeMap: Record<string, string> = {
      'text/javascript': 'javascript',
      'text/typescript': 'typescript',
      'text/x-python': 'python',
      'text/x-rust': 'rust',
      'text/x-go': 'go',
      'text/x-c': 'c',
      'text/x-c++': 'cpp',
      'text/x-java': 'java',
      'text/x-ruby': 'ruby',
      'text/x-php': 'php',
      'text/x-swift': 'swift',
      'text/x-kotlin': 'kotlin',
      'text/x-scala': 'scala',
      'text/x-haskell': 'haskell',
      'text/x-ocaml': 'ocaml',
      'text/x-clojure': 'clojure',
      'text/x-racket': 'racket',
      'text/x-dart': 'dart',
      'text/x-nim': 'nim',
      'text/x-zig': 'zig',
      'text/x-v': 'v',
      'text/x-fortran': 'fortran',
      'text/x-objc': 'objc',
      'text/x-csharp': 'csharp',
      'text/x-vb': 'vb',
      'text/x-pascal': 'pascal',
      'text/x-perl': 'perl',
      'text/x-bash': 'bash',
      'text/x-powershell': 'powershell',
      'text/x-batch': 'batch',
      'text/x-sql': 'sql',
      'text/x-r': 'r',
      'text/x-julia': 'julia',
      'text/x-d': 'd',
      'text/x-lua': 'lua',
      'text/x-tcl': 'tcl',
      'text/x-awk': 'awk',
      'text/x-sed': 'sed',
      'text/yaml': 'yaml',
      'application/json': 'json',
      'text/x-toml': 'toml',
      'text/x-ini': 'ini',
      'text/markdown': 'markdown',
      'text/plain': 'text',
      'text/x-rst': 'rst',
      'text/x-asciidoc': 'asciidoc',
      'text/x-latex': 'latex',
      'text/html': 'html',
      'text/css': 'css',
      'text/x-scss': 'scss',
      'text/x-sass': 'sass',
      'text/x-less': 'less',
      'text/xml': 'xml',
      'image/svg+xml': 'svg'
    };

    return mimeMap[mimeType] || null;
  }

  private detectFromContent(content: string): string | null {
    const firstLines = content.split('\n').slice(0, 10).join('\n').toLowerCase();
    
    // Check for common patterns
    if (firstLines.includes('<?php')) return 'php';
    if (firstLines.includes('#!/usr/bin/env') || firstLines.includes('#!/bin/')) return 'bash';
    if (firstLines.includes('package main')) return 'go';
    if (firstLines.includes('fn main')) return 'rust';
    if (firstLines.includes('def main') || firstLines.includes('if __name__')) return 'python';
    if (firstLines.includes('function main') || firstLines.includes('int main')) return 'c';
    if (firstLines.includes('public class') || firstLines.includes('public static void main')) return 'java';
    if (firstLines.includes('class') && firstLines.includes('def')) return 'python';
    if (firstLines.includes('module') && firstLines.includes('main')) return 'haskell';
    if (firstLines.includes('namespace') && firstLines.includes('class')) return 'csharp';
    if (firstLines.includes('package') && firstLines.includes('import')) return 'java';
    if (firstLines.includes('import') && firstLines.includes('export')) return 'javascript';
    if (firstLines.includes('require') && firstLines.includes('module.exports')) return 'javascript';
    if (firstLines.includes('use strict')) return 'javascript';
    if (firstLines.includes('#!/usr/bin/env node')) return 'javascript';
    if (firstLines.includes('#!/usr/bin/env python')) return 'python';
    if (firstLines.includes('#!/usr/bin/env ruby')) return 'ruby';
    if (firstLines.includes('#!/usr/bin/env perl')) return 'perl';
    if (firstLines.includes('#!/usr/bin/env bash')) return 'bash';
    if (firstLines.includes('#!/usr/bin/env zsh')) return 'bash';
    if (firstLines.includes('#!/usr/bin/env fish')) return 'bash';
    if (firstLines.includes('#!/usr/bin/env ksh')) return 'bash';
    if (firstLines.includes('#!/usr/bin/env csh')) return 'bash';
    if (firstLines.includes('#!/usr/bin/env tcsh')) return 'bash';
    if (firstLines.includes('#!/usr/bin/env tclsh')) return 'tcl';
    if (firstLines.includes('#!/usr/bin/env wish')) return 'tcl';
    if (firstLines.includes('#!/usr/bin/env awk')) return 'awk';
    if (firstLines.includes('#!/usr/bin/env sed')) return 'sed';
    if (firstLines.includes('#!/usr/bin/env lua')) return 'lua';
    if (firstLines.includes('#!/usr/bin/env php')) return 'php';
    if (firstLines.includes('#!/usr/bin/env R')) return 'r';
    if (firstLines.includes('#!/usr/bin/env Rscript')) return 'r';
    if (firstLines.includes('#!/usr/bin/env julia')) return 'julia';
    if (firstLines.includes('#!/usr/bin/env dmd')) return 'd';
    if (firstLines.includes('#!/usr/bin/env ldc2')) return 'd';
    if (firstLines.includes('#!/usr/bin/env gdc')) return 'd';
    if (firstLines.includes('#!/usr/bin/env nim')) return 'nim';
    if (firstLines.includes('#!/usr/bin/env zig')) return 'zig';
    if (firstLines.includes('#!/usr/bin/env v')) return 'v';
    if (firstLines.includes('#!/usr/bin/env dart')) return 'dart';
    if (firstLines.includes('#!/usr/bin/env swift')) return 'swift';
    if (firstLines.includes('#!/usr/bin/env kotlin')) return 'kotlin';
    if (firstLines.includes('#!/usr/bin/env scala')) return 'scala';
    if (firstLines.includes('#!/usr/bin/env clojure')) return 'clojure';
    if (firstLines.includes('#!/usr/bin/env racket')) return 'racket';
    if (firstLines.includes('#!/usr/bin/env haskell')) return 'haskell';
    if (firstLines.includes('#!/usr/bin/env ghc')) return 'haskell';
    if (firstLines.includes('#!/usr/bin/env ocaml')) return 'ocaml';
    if (firstLines.includes('#!/usr/bin/env fsharp')) return 'fsharp';
    if (firstLines.includes('#!/usr/bin/env elixir')) return 'elixir';
    if (firstLines.includes('#!/usr/bin/env erlang')) return 'erlang';
    if (firstLines.includes('#!/usr/bin/env crystal')) return 'crystal';
    
    return null;
  }

  private getParserForLanguage(language: string): string | undefined {
    const parserMap: Record<string, string | undefined> = {
      'javascript': 'tree-sitter-javascript',
      'typescript': 'tree-sitter-typescript',
      'python': 'tree-sitter-python',
      'rust': 'tree-sitter-rust',
      'go': 'tree-sitter-go',
      'c': 'tree-sitter-c',
      'cpp': 'tree-sitter-cpp',
      'java': 'tree-sitter-java',
      'ruby': 'tree-sitter-ruby',
      'php': 'tree-sitter-php',
      'swift': 'tree-sitter-swift',
      'kotlin': 'tree-sitter-kotlin',
      'scala': 'tree-sitter-scala',
      'haskell': 'tree-sitter-haskell',
      'ocaml': 'tree-sitter-ocaml',
      'clojure': 'tree-sitter-clojure',
      'racket': 'tree-sitter-racket',
      'dart': 'tree-sitter-dart',
      'nim': 'tree-sitter-nim',
      'zig': 'tree-sitter-zig',
      'v': 'tree-sitter-v',
      'fortran': 'tree-sitter-fortran',
      'objc': 'tree-sitter-objc',
      'csharp': 'tree-sitter-csharp',
      'vb': 'tree-sitter-vb',
      'pascal': 'tree-sitter-pascal',
      'perl': 'tree-sitter-perl',
      'bash': 'tree-sitter-bash',
      'powershell': 'tree-sitter-powershell',
      'batch': 'tree-sitter-batch',
      'sql': 'tree-sitter-sql',
      'r': 'tree-sitter-r',
      'julia': 'tree-sitter-julia',
      'd': 'tree-sitter-d',
      'lua': 'tree-sitter-lua',
      'tcl': 'tree-sitter-tcl',
      'awk': 'tree-sitter-awk',
      'sed': 'tree-sitter-sed',
      'yaml': 'tree-sitter-yaml',
      'json': 'tree-sitter-json',
      'toml': 'tree-sitter-toml',
      'ini': 'tree-sitter-ini',
      'markdown': 'tree-sitter-markdown',
      'text': undefined,
      'rst': 'tree-sitter-rst',
      'asciidoc': 'tree-sitter-asciidoc',
      'latex': 'tree-sitter-latex',
      'html': 'tree-sitter-html',
      'css': 'tree-sitter-css',
      'scss': 'tree-sitter-scss',
      'sass': 'tree-sitter-sass',
      'less': 'tree-sitter-less',
      'xml': 'tree-sitter-xml',
      'svg': 'tree-sitter-svg'
    };

    return parserMap[language];
  }
} 