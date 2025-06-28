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
        // Get the path to Sample.HTML
        const sampleHtmlPath = path.join(this.context.extensionPath, 'Sample.HTML');
        
        // Read the HTML content
        let htmlContent = fs.readFileSync(sampleHtmlPath, 'utf8');

        // Add the necessary script for VS Code WebView communication
        const vscodeApiScript = `
        <script>
            const vscode = acquireVsCodeApi();

            // Handle messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'setContent') {
                    document.getElementById('listInput').value = message.content;
                }
            });

            // Override the original convertAndCopy function
            function convertAndCopy() {
                // Get the input value   
                var list = document.getElementById("listInput").value.trim();

                // Check if remove duplicates option is selected 
                var removeDuplicates = document.getElementById("removeDuplicates").checked;

                // Get the selected separator 
                var separator = document.getElementById("separator").value;

                // Get the selected enclosure 
                var enclosure = "'";
                var enclosureSingle = document.getElementById("enclosureSingle");
                var enclosureDouble = document.getElementById("enclosureDouble");
                var sqlInClause = document.getElementById("sqlInClause");

                if (enclosureDouble.checked) {
                    enclosure = '"';
                }

                // Convert the list to a comma-separated line   
                var lines = list.split("\\n").filter(line => line.trim() !== "");

                // Remove duplicates if option is selected 
                if (removeDuplicates) {
                    lines = [...new Set(lines)];
                }

                let commaSeparatedLine;

                if (sqlInClause && sqlInClause.checked) {
                    // Format as SQL IN clause
                    commaSeparatedLine = "IN (" + lines.map(function (value) {
                        return enclosure + value + enclosure;
                    }).join(separator) + ")";
                } else {
                    // Regular format
                    commaSeparatedLine = lines.map(function (value) {
                        return enclosure + value + enclosure;
                    }).join(separator);
                }

                // Create a temporary textarea element to copy the converted line   
                var tempTextarea = document.createElement("textarea");
                tempTextarea.value = commaSeparatedLine;
                document.body.appendChild(tempTextarea);

                // Copy the converted line to the clipboard   
                tempTextarea.select();
                document.execCommand("copy");

                // Remove the temporary textarea element   
                document.body.removeChild(tempTextarea);

                var x = new Date();
                document.getElementById('Status').innerHTML = 'Copied ' + lines.length + ' Records at ' + x.toLocaleString();

                // Notify the extension
                vscode.postMessage({
                    command: 'convertAndCopy',
                    count: lines.length
                });
            }
        </script>`;

        // Add SQL IN clause option
        const sqlInClauseOption = `
        <div class="option-group">
            <label for="sqlInClause">SQL IN Clause:</label>
            <input type="checkbox" id="sqlInClause">
        </div>`;

        // Update HTML title
        htmlContent = htmlContent.replace(
            '<title>List to Comma Separated Line</title>',
            '<title>List to CSV Converter</title>'
        );

        // Insert SQL IN clause option before the convert button
        htmlContent = htmlContent.replace(
            '<button onclick="convertAndCopy()">Convert and Copy</button>',
            `${sqlInClauseOption}\n    <button onclick="convertAndCopy()">Convert and Copy</button>`
        );

        // Append our script just before the end of body
        htmlContent = htmlContent.replace(
            '</body>',
            `${vscodeApiScript}\n</body>`
        );

        // Fix broken HTML (from the sample file)
        htmlContent = htmlContent.replace(
            '<!-- alert("Copied to clipboard: " + commaSeparatedLine);   -- ',
            '<!-- alert("Copied to clipboard: " + commaSeparatedLine); -->'
        );

        return htmlContent;
    }
}
