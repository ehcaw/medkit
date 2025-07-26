# MedKit

MedKit is a Visual Studio Code extension that provides a collection of tools and utilities for medical software development, helping you write cleaner, safer, and more compliant code.

## Setting up
```
npm install
npm install -g @vscode/vsce
vsce package
```
Open VS Code
   - Go to Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS)
   - Click the "..." in the top right of the Extensions view
   - Select "Install from VSIX..."
   - Browse to and select your .vsix file

## Features

MedKit comes with a rich set of features designed to streamline your development workflow:

*   **Code Snippets:** Quickly insert common medical and healthcare-related code snippets.
*   **Linter:** Enforce coding standards and best practices for medical software.
*   **Documentation Generator:** Automatically generate documentation for your code.


## Requirements

There are no special requirements for this extension.

## Extension Settings

This extension contributes the following settings:

*   `medkit.enable`: Enable/disable this extension.
*   `medkit.linter.rulesPath`: Set a path to custom linter rules.

## Known Issues

There are currently no known issues.

## Release Notes

### 1.0.0

- Initial release of MedKit.

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
