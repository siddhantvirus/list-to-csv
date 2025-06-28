"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) {k2 = k;}
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) {k2 = k;}
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) {if (Object.prototype.hasOwnProperty.call(o, k)) {ar[ar.length] = k;}}
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) {return mod;}
        var result = {};
        if (mod != null) {for (var k = ownKeys(mod), i = 0; i < k.length; i++) {if (k[i] !== "default") {__createBinding(result, mod, k[i]);}}}
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListToCSVWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
class ListToCSVWebviewProvider {
    context;
    static viewType = 'list-to-csv.webview';
    _panel;
    _extensionUri;
    constructor(context) {
        this.context = context;
        this._extensionUri = context.extensionUri;
    }
    show() {
        if (this._panel) {
            // If the webview panel already exists, reveal it
            this._panel.reveal(vscode.ViewColumn.One);
        }
        else {
            // Create a new webview panel
            this._panel = vscode.window.createWebviewPanel(ListToCSVWebviewProvider.viewType, 'List to CSV Converter', vscode.ViewColumn.One, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this._extensionUri]
            });
            // Set webview content
            this._panel.webview.html = this._getWebviewContent(this._panel.webview);
            // Listen for messages from the WebView
            this._panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'convertAndCopy':
                        vscode.window.showInformationMessage(`Converted and copied ${message.count} records to clipboard!`);
                        return;
                    case 'sqlTableCreated':
                        vscode.window.showInformationMessage(`SQL table successfully generated for ${message.dialect.toUpperCase()} dialect!`);
                        return;
                    case 'generateSql':
                        vscode.env.clipboard.writeText(message.sql);
                        vscode.window.showInformationMessage(`SQL table definition copied to clipboard!`);
                        return;
                    case 'error':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            }, null, this.context.subscriptions);
            // Reset when the panel is closed
            this._panel.onDidDispose(() => {
                this._panel = undefined;
            }, null, this.context.subscriptions);
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
    _getWebviewContent(webview) {
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

                    <div class="option-card">
                        <h3>SQL Table</h3>
                        <div class="checkbox-container">
                            <input type="checkbox" id="generateSqlTable">
                            <label for="generateSqlTable">Generate SQL Table</label>
                        </div>
                        <div class="input-container" style="margin-top: 8px;">
                            <label for="tableName">Table Name:</label>
                            <input type="text" id="tableName" placeholder="my_table" style="margin-top: 4px;">
                        </div>
                        <div class="select-container" style="margin-top: 8px;">
                            <label for="sqlDialect">SQL Dialect:</label>
                            <select id="sqlDialect" style="width: 100%; margin-top: 4px; padding: 4px; background-color: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border);">
                                <option value="mssql">MS SQL Server</option>
                                <option value="spark">Spark SQL</option>
                                <option value="mysql">MySQL</option>
                                <option value="postgres">PostgreSQL</option>
                            </select>
                        </div>
                        <div class="checkbox-container" style="margin-top: 8px;">
                            <input type="checkbox" id="inferDataTypes">
                            <label for="inferDataTypes">Auto-infer Data Types</label>
                        </div>
                    </div>
                </div>

                <div class="button-row">
                    <button id="convertButton" onclick="convertAndPreview()">Preview</button>
                    <button id="copyButton" onclick="convertAndCopy()">Convert & Copy</button>
                    <button id="generateSqlButton" onclick="generateAndCopySql()" disabled>Generate SQL Table & Data</button>
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
                    
                    // Set up SQL table generation options
                    const generateSqlTable = document.getElementById('generateSqlTable');
                    const sqlControls = document.querySelectorAll('#tableName, #sqlDialect, #inferDataTypes');
                    const generateSqlButton = document.getElementById('generateSqlButton');
                    
                    // Function to toggle SQL controls
                    function toggleSqlControls() {
                        const enabled = generateSqlTable.checked;
                        sqlControls.forEach(control => {
                            control.disabled = !enabled;
                        });
                        generateSqlButton.disabled = !enabled;
                    }
                    
                    // Initialize SQL controls
                    toggleSqlControls();
                    
                    // Add event listener for generateSqlTable checkbox
                    generateSqlTable.addEventListener('change', toggleSqlControls);
                });

                // Preview function - shows result without copying
                function convertAndPreview() {
                    const result = processInput();
                    if (!result) { return; }
                    
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
                    const generateSqlTable = document.getElementById("generateSqlTable").checked;
                    const tableName = document.getElementById("tableName").value || "my_table";
                    const sqlDialect = document.getElementById("sqlDialect").value;
                    const inferDataTypes = document.getElementById("inferDataTypes").checked;
                    
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
                    if (!result) { return; }
                    
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

                // Generate SQL function
                function generateAndCopySql() {
                    // Check if SQL generation is enabled
                    const generateSqlTable = document.getElementById("generateSqlTable").checked;
                    if (!generateSqlTable) {
                        showStatus('SQL Table generation is not enabled', false);
                        return;
                    }
                    
                    // Get the input value
                    const list = document.getElementById("listInput").value.trim();
                    if (!list) {
                        showStatus('Please enter some text in the input area', false);
                        return;
                    }
                    
                    // Get SQL options
                    const tableName = document.getElementById("tableName").value || "my_table";
                    const sqlDialect = document.getElementById("sqlDialect").value;
                    const inferDataTypes = document.getElementById("inferDataTypes").checked;
                    
                    // Split text into lines
                    let lines = list.split("\\n").filter(line => line.trim() !== "");
                    if (lines.length === 0) {
                        showStatus('No valid data found', false);
                        return;
                    }
                    
                    // Try to detect if the data is tabular
                    let separator = detectSeparator(lines[0]);
                    
                    // Create columns and data structure
                    const firstLine = lines[0];
                    let headers = [];
                    let dataLines = [];
                    
                    if (separator) {
                        // Data is tabular - first line might be headers
                        headers = firstLine.split(separator).map(h => h.trim());
                        
                        // Process the rest as data rows
                        for (let i = 1; i < lines.length; i++) {
                            if (lines[i].trim()) {
                                dataLines.push(lines[i].split(separator).map(cell => cell.trim()));
                            }
                        }
                    } else {
                        // Single column data
                        headers = ['Column1'];
                        dataLines = lines.map(line => [line.trim()]);
                    }
                    
                    // Clean header names to be valid SQL identifiers
                    headers = headers.map((header, index) => {
                        // If header is empty or just spaces, provide a default name
                        if (!header || header.trim() === '') {
                            return \`Column\${index + 1}\`;
                        }
                        
                        // Replace invalid characters with underscore
                        return header.replace(/[^a-zA-Z0-9_]/g, '_');
                    });
                    
                    // Generate SQL statement
                    const sql = createSqlTableStatement(headers, dataLines, tableName, sqlDialect, inferDataTypes);
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(sql).then(() => {
                        showStatus(\`Success! SQL table created for \${sqlDialect.toUpperCase()} dialect\`, true);
                        
                        // Show preview
                        const previewContainer = document.getElementById('previewContainer');
                        const outputPreview = document.getElementById('outputPreview');
                        outputPreview.textContent = sql;
                        previewContainer.classList.remove('hidden');
                        
                        // Notify the extension
                        vscode.postMessage({
                            command: 'sqlTableCreated',
                            dialect: sqlDialect
                        });
                    }).catch(err => {
                        showStatus('Failed to copy SQL: ' + err, false);
                        vscode.postMessage({
                            command: 'error',
                            text: 'Failed to copy SQL: ' + err
                        });
                    });
                }
                
                // Detect the separator used in data
                function detectSeparator(line) {
                    if (line.includes('\\t')) {
                        return '\\t';
                    } else if (line.includes(',')) {
                        return ',';
                    } else if (line.includes('|')) {
                        return '|';
                    } else if (line.match(/\\s{2,}/)) {
                        return ' '; // Use a space as separator
                    }
                    return null;
                }

                // Create SQL table statement
                function createSqlTableStatement(headers, sampleData, tableName, dialect, inferDataTypes) {
                    // Start building the SQL statement
                    let sql = '';
                    
                    // Add CREATE TABLE clause with proper identifier quoting
                    switch (dialect) {
                        case 'mssql':
                            sql = \`CREATE TABLE [\${tableName}] (\\n\`;
                            break;
                        case 'mysql':
                            sql = \`CREATE TABLE \\\`\${tableName}\\\` (\\n\`;
                            break;
                        case 'postgres':
                            sql = \`CREATE TABLE "\${tableName}" (\\n\`;
                            break;
                        case 'spark':
                            sql = \`CREATE TABLE \${tableName} (\\n\`;
                            break;
                    }
                    
                    // Add columns
                    for (let i = 0; i < headers.length; i++) {
                        const header = headers[i];
                        let dataType = inferDataTypes && sampleData.length > 0 
                            ? inferSqlDataType(sampleData, i, dialect) 
                            : getDefaultDataType(dialect);
                        
                        // Add column definition with proper identifier quoting
                        switch (dialect) {
                            case 'mssql':
                                sql += \`    [\${header}] \${dataType}\`;
                                break;
                            case 'mysql':
                                sql += \`    \\\`\${header}\\\` \${dataType}\`;
                                break;
                            case 'postgres':
                                sql += \`    "\${header}" \${dataType}\`;
                                break;
                            case 'spark':
                                sql += \`    \${header} \${dataType}\`;
                                break;
                        }
                        
                        if (i < headers.length - 1) {
                            sql += ',\\n';
                        } else {
                            sql += '\\n';
                        }
                    }
                    
                    // Close the statement
                    sql += ')';
                    
                    // Add dialect-specific extras
                    if (dialect === 'spark') {
                        sql += '\\nUSING DELTA';
                    } else if (dialect === 'mysql') {
                        sql += '\\nENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
                    } else if (dialect === 'postgres') {
                        sql += ';';
                    }
                    
                    // Add INSERT statements for data
                    if (sampleData.length > 0) {
                        sql += '\\n\\n-- Insert data into table\\n';
                        
                        // For batched multi-row inserts, we'll use different approaches based on the dialect
                        switch (dialect) {
                            case 'mssql':
                                // SQL Server doesn't support standard multi-row syntax, but can use table value constructor
                                sql += \`INSERT INTO [\${tableName}] (\`;
                                
                                // Add column names
                                for (let j = 0; j < headers.length; j++) {
                                    sql += \`[\${headers[j]}]\`;
                                    if (j < headers.length - 1) {
                                        sql += ', ';
                                    }
                                }
                                
                                sql += ') VALUES\\n';
                                
                                // Add all rows
                                for (let i = 0; i < sampleData.length; i++) {
                                    const row = sampleData[i];
                                    sql += '    (';
                                    
                                    // Add values with proper SQL escaping
                                    for (let j = 0; j < headers.length; j++) {
                                        const value = j < row.length ? row[j] : '';
                                        const formattedValue = formatSqlValue(value, inferDataTypes, dialect);
                                        sql += formattedValue;
                                        
                                        if (j < headers.length - 1) {
                                            sql += ', ';
                                        }
                                    }
                                    
                                    sql += ')';
                                    if (i < sampleData.length - 1) {
                                        sql += ',';
                                    }
                                    sql += '\\n';
                                }
                                break;
                                
                            case 'mysql':
                                // MySQL supports standard multi-row INSERT syntax
                                sql += \`INSERT INTO \\\`\${tableName}\\\` (\`;
                                
                                // Add column names
                                for (let j = 0; j < headers.length; j++) {
                                    sql += \`\\\`\${headers[j]}\\\`\`;
                                    if (j < headers.length - 1) {
                                        sql += ', ';
                                    }
                                }
                                
                                sql += ') VALUES\\n';
                                
                                // Add all rows
                                for (let i = 0; i < sampleData.length; i++) {
                                    const row = sampleData[i];
                                    sql += '    (';
                                    
                                    // Add values with proper SQL escaping
                                    for (let j = 0; j < headers.length; j++) {
                                        const value = j < row.length ? row[j] : '';
                                        const formattedValue = formatSqlValue(value, inferDataTypes, dialect);
                                        sql += formattedValue;
                                        
                                        if (j < headers.length - 1) {
                                            sql += ', ';
                                        }
                                    }
                                    
                                    sql += ')';
                                    if (i < sampleData.length - 1) {
                                        sql += ',';
                                    }
                                    sql += '\\n';
                                }
                                sql += ';';
                                break;
                                
                            case 'postgres':
                                // PostgreSQL supports standard multi-row INSERT syntax
                                sql += \`INSERT INTO "\${tableName}" (\`;
                                
                                // Add column names
                                for (let j = 0; j < headers.length; j++) {
                                    sql += \`"\${headers[j]}"\`;
                                    if (j < headers.length - 1) {
                                        sql += ', ';
                                    }
                                }
                                
                                sql += ') VALUES\\n';
                                
                                // Add all rows
                                for (let i = 0; i < sampleData.length; i++) {
                                    const row = sampleData[i];
                                    sql += '    (';
                                    
                                    // Add values with proper SQL escaping
                                    for (let j = 0; j < headers.length; j++) {
                                        const value = j < row.length ? row[j] : '';
                                        const formattedValue = formatSqlValue(value, inferDataTypes, dialect);
                                        sql += formattedValue;
                                        
                                        if (j < headers.length - 1) {
                                            sql += ', ';
                                        }
                                    }
                                    
                                    sql += ')';
                                    if (i < sampleData.length - 1) {
                                        sql += ',';
                                    }
                                    sql += '\\n';
                                }
                                sql += ';';
                                break;
                                
                            case 'spark':
                                // Spark SQL supports standard multi-row INSERT syntax
                                sql += \`INSERT INTO \${tableName} (\`;
                                
                                // Add column names
                                for (let j = 0; j < headers.length; j++) {
                                    sql += headers[j];
                                    if (j < headers.length - 1) {
                                        sql += ', ';
                                    }
                                }
                                
                                sql += ') VALUES\\n';
                                
                                // Add all rows
                                for (let i = 0; i < sampleData.length; i++) {
                                    const row = sampleData[i];
                                    sql += '    (';
                                    
                                    // Add values with proper SQL escaping
                                    for (let j = 0; j < headers.length; j++) {
                                        const value = j < row.length ? row[j] : '';
                                        const formattedValue = formatSqlValue(value, inferDataTypes, dialect);
                                        sql += formattedValue;
                                        
                                        if (j < headers.length - 1) {
                                            sql += ', ';
                                        }
                                    }
                                    
                                    sql += ')';
                                    if (i < sampleData.length - 1) {
                                        sql += ',';
                                    }
                                    sql += '\\n';
                                }
                                break;
                        }
                    }
                    
                    return sql;
                }
                
                // Format SQL value based on its content and dialect
                function formatSqlValue(value, inferDataTypes, dialect) {
                    if (!value || value.trim() === '') {
                        return 'NULL';
                    }
                    
                    // Try to convert to number
                    const num = Number(value);
                    if (!isNaN(num) && inferDataTypes) {
                        return value;
                    }
                    
                    // Check for date patterns
                    const datePattern = /^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}$/;
                    const timestampPattern = /^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}[T\\s]\\d{1,2}:\\d{1,2}(:\\d{1,2})?$/;
                    
                    if ((datePattern.test(value) || timestampPattern.test(value)) && inferDataTypes) {
                        if (dialect === 'spark') {
                            return \`'\${value}'\`;
                        } else if (dialect === 'mssql') {
                            return \`'\${value}'\`;
                        } else {
                            return \`'\${value}'\`;
                        }
                    }
                    
                    // Escape single quotes
                    const escaped = value.replace(/'/g, "''");
                    return \`'\${escaped}'\`;
                }

                // Infer SQL data type from sample data
                function inferSqlDataType(sampleData, columnIndex, dialect) {
                    // Get sample values from the column
                    const sampleValues = sampleData
                        .map(row => columnIndex < row.length ? row[columnIndex] : '')
                        .filter(value => value !== null && value !== undefined && value.trim() !== '');
                    
                    if (sampleValues.length === 0) {
                        return getDefaultDataType(dialect);
                    }

                    // Check if all values are numeric
                    let allNumbers = true;
                    let allIntegers = true;
                    let maxLength = 0;
                    
                    for (const value of sampleValues) {
                        // Update max text length
                        maxLength = Math.max(maxLength, value.length);
                        
                        // Check if can be parsed as a number
                        const num = Number(value);
                        if (isNaN(num)) {
                            allNumbers = false;
                            allIntegers = false;
                        } else if (!Number.isInteger(num)) {
                            allIntegers = false;
                        }
                        
                        // Stop checking numbers if we already know it's not all numbers
                        if (!allNumbers) {
                            break;
                        }
                    }
                    
                    // Check for date patterns
                    const datePattern = /^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}$/;
                    const allDates = sampleValues.every(value => datePattern.test(value));
                    
                    // Timestamp pattern (date with time)
                    const timestampPattern = /^\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}[T\\s]\\d{1,2}:\\d{1,2}(:\\d{1,2})?$/;
                    const allTimestamps = sampleValues.every(value => timestampPattern.test(value));
                    
                    // Determine data type based on dialect
                    switch (dialect) {
                        case 'mssql':
                            if (allTimestamps) { return 'DATETIME'; }
                            if (allDates) { return 'DATE'; }
                            if (allIntegers) { return 'INT'; }
                            if (allNumbers) { return 'FLOAT'; }
                            if (maxLength <= 255) { return \`VARCHAR(255)\`; }
                            return 'TEXT';
                            
                        case 'mysql':
                            if (allTimestamps) { return 'DATETIME'; }
                            if (allDates) { return 'DATE'; }
                            if (allIntegers) { return 'INT'; }
                            if (allNumbers) { return 'FLOAT'; }
                            if (maxLength <= 255) { return \`VARCHAR(255)\`; }
                            return 'TEXT';
                            
                        case 'postgres':
                            if (allTimestamps) { return 'TIMESTAMP'; }
                            if (allDates) { return 'DATE'; }
                            if (allIntegers) { return 'INTEGER'; }
                            if (allNumbers) { return 'DECIMAL'; }
                            if (maxLength <= 255) { return \`VARCHAR(255)\`; }
                            return 'TEXT';
                            
                        case 'spark':
                            if (allTimestamps) { return 'TIMESTAMP'; }
                            if (allDates) { return 'DATE'; }
                            if (allIntegers) { return 'INT'; }
                            if (allNumbers) { return 'DOUBLE'; }
                            return 'STRING';
                    }
                    
                    return getDefaultDataType(dialect);
                }

                // Get default data type for a SQL dialect
                function getDefaultDataType(dialect) {
                    switch (dialect) {
                        case 'mssql': return 'VARCHAR(255)';
                        case 'mysql': return 'VARCHAR(255)';
                        case 'postgres': return 'VARCHAR(255)';
                        case 'spark': return 'STRING';
                        default: return 'VARCHAR(255)';
                    }
                }
            </script>
        </body>
        </html>`;
    }
}
exports.ListToCSVWebviewProvider = ListToCSVWebviewProvider;
//# sourceMappingURL=listToCSVWebviewProvider.js.map