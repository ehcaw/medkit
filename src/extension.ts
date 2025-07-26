// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "medkit" is now active!');

  // Create the webview provider
  const provider = new MedKitPanelProvider(context.extensionUri);

  // Register the webview view provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("medkit-panel", provider)
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "medkit.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from medkit!");
    }
  );

  // Register open panel command
  const openPanelCommand = vscode.commands.registerCommand(
    "medkit.openPanel",
    () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.medkit-container"
      );
    }
  );

  context.subscriptions.push(disposable, openPanelCommand);
}

class MedKitPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "medkit-panel";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "execute":
          this.handleExecute(message.data);
          break;
        case "addStep":
          this.handleAddStep();
          break;
        case "removeStep":
          this.handleRemoveStep(message.stepId);
          break;
      }
    }, undefined);
  }

  private handleExecute(data: any) {
    const { url, steps } = data;
    vscode.window.showInformationMessage(
      `Executing workflow with URL: ${url} and ${steps.length} steps`
    );

    // Here you can add your execution logic
    console.log("Workflow data:", data);
  }

  private handleAddStep() {
    if (this._view) {
      this._view.webview.postMessage({ type: "addStep" });
    }
  }

  private handleRemoveStep(stepId: string) {
    if (this._view) {
      this._view.webview.postMessage({ type: "removeStep", stepId });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "webview-ui", "dist", "bundle.js")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval';">
        <title>MedKit Workflow Builder</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// This method is called when your extension is deactivated
export function deactivate() {}
