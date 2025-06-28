import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ListToCSVWebviewProvider {
    public static readonly viewType = 'list-to-csv.webview';
    private _panel: vscode.WebviewPanel | undefined;
    private readonly _extensionUri: vscode.Uri;

    constructor(private readonly context: vscode.ExtensionContext) {
        this._extensionUri = context.extensionUri;
    }

    public show() {
        if (this._panel) {
            // If the webview panel already exists, reveal it
            this._panel.reveal(vscode.ViewColumn.One);
        } else {
            // Create a new webview panel
            this._panel = vscode.window.createWebviewPanel(
                ListToCSVWebviewProvider.viewType,
                'List to CSV Converter',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [this._extensionUri]
                }
            );

            // Set webview content
            this._panel.webview.html = this._getWebviewContent(this._panel.webview);

            // Listen for messages from the WebView
            this._panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'convertAndCopy':
                            vscode.window.showInformationMessage(`Converted and copied ${message.count} records to clipboard!`);
                            return;
                        case 'error':
                            vscode.window.showErrorMessage(message.text);
                            return;
                    }
                },
                null,
                this.context.subscriptions
            );

            // Reset when the panel is closed
            this._panel.onDidDispose(
                () => {
                    this._panel = undefined;
                },
                null,
                this.context.subscriptions
            );
        }

        // If there's an active text editor with a selection, send that text to the webview
        if (vscode.window.activeTextEditor) {
            const editor = vscode.window.activeTextEditor;
            if (!editor.selection.isEmpty) {
                const text = editor.document.getText(editor.selection);
                // Wait for the webview to be ready
                setTimeout(() => {
                    this._panel?.webview.postMessage({
                        command: 'setContent',
                        content: text
                    });
                }, 300);
            }
        }
    }

    private _getWebviewContent(webview: vscode.Webview): string {
        // Create a completely new modern UI instead of modifying Sample.HTML
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>List to CSV Converter</title>
            <style>
                :root {
                    --container-padding: 20px;
                    --input-padding-vertical: 6px;
                    --input-padding-horizontal: 8px;
                    --input-margin-vertical: 4px;
                    --input-margin-horizontal: 0;
                    --border-radius: 4px;
                    --control-height: 28px;
                }

                body {
                    padding: 0;
                    margin: 0;
                    color: var(--vscode-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    font-weight: var(--vscode-font-weight);
                    background-color: var(--vscode-editor-background);
                }
                
                *:focus {
                    outline-color: var(--vscode-focusBorder) !important;
                }

                .container {
                    padding: var(--container-padding);
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                .title {
                    color: var(--vscode-titleBar-activeForeground);
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 0.5rem;
                    font-weight: 500;
                }

                .input-area {
                    margin-bottom: 1rem;
                }

                .input-area label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: var(--vscode-foreground);
                    font-weight: 500;
                }

                textarea {
                    width: 100%;
                    height: 180px;
                    padding: var(--input-padding-vertical) var(--input-padding-horizontal);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: var(--border-radius);
                    color: var(--vscode-input-foreground);
                    background-color: var(--vscode-input-background);
                    resize: vertical;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }

                .options-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .option-card {
                    background-color: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: var(--border-radius);
                    padding: 1rem;
                }

                .option-card h3 {
                    margin-top: 0;
                    margin-bottom: 0.75rem;
                    font-size: 1rem;
                    font-weight: 500;
                    color: var(--vscode-panelTitle-activeForeground);
                }

                .checkbox-container, .radio-container {
                    display: flex;
                    align-items: center;
                    margin: 0.5rem 0;
                }

                .checkbox-container input[type="checkbox"],
                .radio-container input[type="radio"] {
                    margin-right: 8px;
                    accent-color: var(--vscode-checkbox-background);
                }

                input[type="text"] {
                    width: calc(100% - 16px); /* Adjust width accounting for padding */
                    padding: var(--input-padding-vertical) var(--input-padding-horizontal);
                    border: 1px solid var(--vscode-input-border);
                    color: var(--vscode-input-foreground);
                    background-color: var(--vscode-input-background);
                    border-radius: var(--border-radius);
                    box-sizing: border-box; /* Add box-sizing to contain the element within its parent */
                    max-width: 100%; /* Ensure it doesn't overflow its container */
                }

                .separator-input {
                    width: 100%; /* Make the container full width */
                    box-sizing: border-box; /* Ensure padding is included in width calculation */
                }

                button {
                    display: inline-block;
                    border: none;
                    padding: 8px 16px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border-radius: var(--border-radius);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                button:active {
                    transform: translateY(1px);
                }

                .button-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .status-area {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    border-radius: var(--border-radius);
                    background-color: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                }

                .status-area.success {
                    border-color: var(--vscode-notificationsSuccessBorder);
                    background-color: var(--vscode-notificationsSuccessBackground, var(--vscode-panel-background));
                }

                .output-preview {
                    margin-top: 1rem;
                    padding: 0.75rem;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: var(--border-radius);
                    background-color: var(--vscode-editorWidget-background);
                    max-height: 150px;
                    overflow: auto;
                    white-space: pre-wrap;
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                }

                .hidden {
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1 class="title">List to CSV Converter</h1>
                
                <div class="input-area">
                    <label for="listInput">Input Text:</label>
                    <textarea id="listInput" placeholder="Enter your list here (one item per line)"></textarea>
                </div>
                
                <div class="options-grid">
                    <div class="option-card">
                        <h3>List Options</h3>
                        <div class="checkbox-container">
                            <input type="checkbox" id="removeDuplicates">
                            <label for="removeDuplicates">Remove Duplicates</label>
                        </div>
                    </div>

                    <div class="option-card">
                        <h3>Separator</h3>
                        <div class="separator-input">
                            <input type="text" id="separator" value="," placeholder="Separator character">
                        </div>
                    </div>

                    <div class="option-card">
                        <h3>Enclosure</h3>
                        <div class="radio-container">
                            <input type="radio" id="enclosureNone" name="enclosure" value="none">
                            <label for="enclosureNone">No Enclosure</label>
                        </div>
                        <div class="radio-container">
                            <input type="radio" id="enclosureSingle" name="enclosure" value="'" checked>
                            <label for="enclosureSingle">Single Quotes (')</label>
                        </div>
                        <div class="radio-container">
                            <input type="radio" id="enclosureDouble" name="enclosure" value='"'>
                            <label for="enclosureDouble">Double Quotes (")</label>
                        </div>
                    </div>

                    <div class="option-card">
                        <h3>Format</h3>
                        <div class="checkbox-container">
                            <input type="checkbox" id="sqlInClause">
                            <label for="sqlInClause">SQL IN Clause</label>
                        </div>
                    </div>
                </div>

                <div class="button-row">
                    <button id="convertButton" onclick="convertAndPreview()">Preview</button>
                    <button id="copyButton" onclick="convertAndCopy()">Convert & Copy</button>
                </div>

                <div id="previewContainer" class="hidden">
                    <h3>Preview:</h3>
                    <div id="outputPreview" class="output-preview"></div>
                </div>

                <div id="Status" class="status-area hidden"></div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let hasError = false;

                // Handle messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'setContent') {
                        document.getElementById('listInput').value = message.content;
                    }
                });

                // Set up event listeners when the document loads
                document.addEventListener('DOMContentLoaded', function() {
                    // Add input event listener to clear errors when typing
                    document.getElementById('listInput').addEventListener('input', function() {
                        if (hasError) {
                            clearStatus();
                        }
                    });
                    
                    // Add event listeners for all form controls to clear error messages
                    const formControls = document.querySelectorAll('input, textarea, select');
                    formControls.forEach(control => {
                        control.addEventListener('change', function() {
                            if (hasError) {
                                clearStatus();
                            }
                        });
                    });
                });

                // Preview function - shows result without copying
                function convertAndPreview() {
                    const result = processInput();
                    if (!result) return;
                    
                    const previewContainer = document.getElementById('previewContainer');
                    const outputPreview = document.getElementById('outputPreview');
                    
                    outputPreview.textContent = result;
                    previewContainer.classList.remove('hidden');
                }

                // Process the input and return the result string
                function processInput() {
                    // Get the input value   
                    const list = document.getElementById("listInput").value.trim();
                    if (!list) {
                        showStatus('Please enter some text in the input area', false);
                        return null;
                    }

                    // Get options
                    const removeDuplicates = document.getElementById("removeDuplicates").checked;
                    const separator = document.getElementById("separator").value;
                    const enclosureNone = document.getElementById("enclosureNone").checked;
                    const enclosureSingle = document.getElementById("enclosureSingle").checked;
                    const sqlInClause = document.getElementById("sqlInClause").checked;
                    
                    // Determine enclosure type
                    let enclosure = '';
                    if (!enclosureNone) {
                        enclosure = enclosureSingle ? "'" : '"';
                    }

                    // Convert the list to a comma-separated line   
                    let lines = list.split("\\n").filter(line => line.trim() !== "");

                    // Remove duplicates if option is selected 
                    if (removeDuplicates) {
                        lines = [...new Set(lines)];
                    }

                    // Format the output
                    let commaSeparatedLine;
                    if (sqlInClause) {
                        // Format as SQL IN clause
                        commaSeparatedLine = "IN (" + lines.map(function (value) {
                            return enclosure ? (enclosure + value + enclosure) : value;
                        }).join(separator) + ")";
                    } else {
                        // Regular format
                        commaSeparatedLine = lines.map(function (value) {
                            return enclosure ? (enclosure + value + enclosure) : value;
                        }).join(separator);
                    }

                    return commaSeparatedLine;
                }

                // Copy to clipboard function
                function convertAndCopy() {
                    const result = processInput();
                    if (!result) return;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(result).then(() => {
                        const linesCount = document.getElementById("listInput")
                            .value.trim()
                            .split("\\n")
                            .filter(line => line.trim() !== "")
                            .length;
                            
                        showStatus(\`Success! Copied \${linesCount} records to clipboard\`, true);
                        
                        // Show preview
                        const previewContainer = document.getElementById('previewContainer');
                        const outputPreview = document.getElementById('outputPreview');
                        outputPreview.textContent = result;
                        previewContainer.classList.remove('hidden');
                        
                        // Notify the extension
                        vscode.postMessage({
                            command: 'convertAndCopy',
                            count: linesCount
                        });
                    }).catch(err => {
                        showStatus('Failed to copy: ' + err, false);
                        vscode.postMessage({
                            command: 'error',
                            text: 'Failed to copy: ' + err
                        });
                    });
                }

                // Clear status message
                function clearStatus() {
                    const statusArea = document.getElementById('Status');
                    statusArea.classList.add('hidden');
                    hasError = false;
                }

                // Show status message
                function showStatus(message, isSuccess) {
                    const statusArea = document.getElementById('Status');
                    statusArea.textContent = message;
                    statusArea.classList.remove('hidden');
                    
                    if (isSuccess) {
                        statusArea.classList.add('success');
                        hasError = false;
                    } else {
                        statusArea.classList.remove('success');
                        hasError = true;
                    }
                    
                    // Auto hide success messages after 5 seconds, but keep errors visible until user interaction
                    if (isSuccess) {
                        setTimeout(() => {
                            if (!statusArea.classList.contains('pinned')) {
                                statusArea.classList.add('hidden');
                            }
                        }, 5000);
                    }
                }
            </script>
        </body>
        </html>`;
    }
}
