#!/bin/bash

# Development script for MedKit VS Code Extension

echo "🚀 Building React UI..."
cd webview-ui
npm run build
cd ..

echo "🔧 Compiling Extension..."
npm run compile

echo "📦 Packaging Extension..."
printf "y\n" | vsce package

echo "✅ Development build complete!"
echo "📁 Package: medkit-0.0.1.vsix"
echo ""
echo "To test the extension:"
echo "1. Press F5 in VS Code to open Extension Development Host"
echo "2. Look for the pulse icon in the activity bar"
echo "3. Click it to open the MedKit Workflow Builder"
