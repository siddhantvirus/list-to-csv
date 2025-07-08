// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ListToCSVWebviewProvider } from './listToCSVWebviewProvider';
import * as fs from 'fs';
import * as path from 'path';
import { formatSqlValue, getDefaultDataType, inferSqlDataType, detectSeparator } from './utils/sqlUtils';

interface ConversionOptions {
    delimiter: string;
    includeHeaders: boolean;
    quoteAllFields: boolean;
    escapeCharacter: string;
}

interface CommaListOptions {
    removeDuplicates: boolean;
    separator: string;
    enclosure: string;
    sqlInClause: boolean;
}

interface SqlTableOptions {
    tableName: string;
    dialect: 'mssql' | 'mysql' | 'postgres' | 'spark';
    inferDataTypes: boolean;
    previewData?: boolean;
    includeHeaders?: boolean;
}

// Constants for storing last used configurations
const LAST_USED_COMMA_LIST_CONFIG = 'lastUsedCommaListConfig';
const LAST_USED_SQL_TABLE_CONFIG = 'lastUsedSqlTableConfig';
const LAST_USED_CSV_CONFIG = 'lastUsedCsvConfig';

// Define message options for expanded alerts
const expandedMessageOptions: vscode.MessageOptions = {
    modal: true,
    detail: '' // We'll set this dynamically when needed
};

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    console.log('Congratulations, your extension "list-to-csv" is now active!');

    // Create an instance of our WebView provider
    const listToCSVWebviewProvider = new ListToCSVWebviewProvider(context);

    // Register the command to open the WebView
    const openWebviewCommand = vscode.commands.registerCommand(
        'list-to-csv.openWebview',
        () => {
            listToCSVWebviewProvider.show();
        }
    );

    // Register the convert to CSV command
    const convertToCSVCommand = vscode.commands.registerTextEditorCommand(
        'list-to-csv.convert',
        async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
            try {
                // Get the options from the settings
                const options = getConversionOptions();
                
                // Get the selected text
                const selection = textEditor.selection;
                if (selection.isEmpty) {
                    const messageOptions = {...expandedMessageOptions};
                    messageOptions.detail = 'Please select text before converting to CSV format.';
                    vscode.window.showInformationMessage('Please select a list to convert to CSV', messageOptions);
                    return;
                }
                
                const selectedText = textEditor.document.getText(selection);
                
                // Detect the list type and convert to CSV
                const csvText = convertListToCSV(selectedText, options);
                
                // Replace the selected text with the CSV
                edit.replace(selection, csvText);
                
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = 'Your list has been successfully converted to CSV format and applied to the text editor.';
                vscode.window.showInformationMessage('List converted to CSV successfully!', messageOptions);
            } catch (error) {
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = `Error details: ${error}`;
                vscode.window.showErrorMessage(`Error converting list to CSV`, messageOptions);
            }
        }
    );

    // Register the command to convert text to comma separated line (similar to HTML page)
    const convertToCommaLineCommand = vscode.commands.registerTextEditorCommand(
        'list-to-csv.convertToCommaLine',
        async (textEditor: vscode.TextEditor) => {
            try {
                // Get the selected text
                const selection = textEditor.selection;
                if (selection.isEmpty) {
                    const messageOptions = {...expandedMessageOptions};
                    messageOptions.detail = 'Please select text before converting to comma-separated line format.';
                    vscode.window.showInformationMessage('Please select a list to convert', messageOptions);
                    return;
                }
                
                const selectedText = textEditor.document.getText(selection);

                // Get options for conversion from user
                const options = await getCommaLineOptions();
                if (!options) {
                    return; // User cancelled the operation
                }
                
                // Convert the text to comma-separated line
                const result = convertToCommaLine(selectedText, options);
                
                // Copy to clipboard
                await vscode.env.clipboard.writeText(result);
                
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = `${options.removeDuplicates ? 'Duplicates removed. ' : ''}${result.length} characters copied to clipboard.`;
                vscode.window.showInformationMessage(
                    `Converted list to ${options.sqlInClause ? 'SQL IN clause' : 'comma-separated line'} and copied to clipboard!`,
                    messageOptions
                );
            } catch (error) {
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = `Error details: ${error}`;
                vscode.window.showErrorMessage(`Error converting list`, messageOptions);
            }
        }
    );

    // Register the command to generate SQL table from selection
    const generateSQLTableCommand = vscode.commands.registerTextEditorCommand(
        'list-to-csv.generateSQLTable',
        async (textEditor: vscode.TextEditor) => {
            try {
                // Get the selected text
                const selection = textEditor.selection;
                if (selection.isEmpty) {
                    const messageOptions = {...expandedMessageOptions};
                    messageOptions.detail = 'Please select text before generating SQL table.';
                    vscode.window.showInformationMessage('Please select data to generate SQL table', messageOptions);
                    return;
                }
                
                const selectedText = textEditor.document.getText(selection);

                // Get SQL table options from user
                const options = await getSqlTableOptions();
                if (!options) {
                    return; // User cancelled the operation
                }
                
                // Parse the data for preview or SQL generation
                const { headers, dataLines } = parseSqlTabularData(selectedText, options.includeHeaders);
                
                // Show preview if requested
                if (options.previewData) {
                    const previewResult = await showDataPreviewWebview(headers, dataLines, options, context);
                    
                    if (previewResult === 'cancelled') {
                        return; // User cancelled after preview
                    }
                    
                    // If user proceeded after preview, generate SQL from the parsed data
                    // This ensures we use the same data that was previewed
                    const sqlStatement = createSqlTableStatement(headers, dataLines, options);
                    
                    // Copy to clipboard
                    await vscode.env.clipboard.writeText(sqlStatement);
                    
                    const messageOptions = {...expandedMessageOptions};
                    messageOptions.detail = `SQL CREATE TABLE statement for ${options.dialect.toUpperCase()} copied to clipboard.`;
                    vscode.window.showInformationMessage(
                        `SQL table created successfully!`,
                        messageOptions
                    );
                    return;
                }
                
                // No preview requested, generate SQL directly
                const sqlStatement = createSqlTableStatement(headers, dataLines, options);
                
                // Copy to clipboard
                await vscode.env.clipboard.writeText(sqlStatement);
                
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = `SQL CREATE TABLE statement for ${options.dialect.toUpperCase()} copied to clipboard.`;
                vscode.window.showInformationMessage(
                    `SQL table created successfully!`,
                    messageOptions
                );
            } catch (error) {
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = `Error details: ${error}`;
                vscode.window.showErrorMessage(`Error generating SQL table`, messageOptions);
            }
        }
    );

    // Register the command to open settings
    const openSettingsCommand = vscode.commands.registerCommand(
        'list-to-csv.openSettings',
        () => {
            vscode.commands.executeCommand('workbench.action.openSettings', 'list-to-csv');
        }
    );

    // Register internal command to save configuration
    const saveConfigCommand = vscode.commands.registerCommand(
        '_listToCSV.saveLastUsedConfig',
        (key: string, config: any) => {
            // Store configuration in global state
            context.globalState.update(key, config);
        }
    );

    // Register the command to use the last configuration
    const lastUsedConfigCommand = vscode.commands.registerTextEditorCommand(
        'list-to-csv.lastUsedConfigurations',
        async (textEditor: vscode.TextEditor) => {
            try {
                // Get the selected text
                const selection = textEditor.selection;
                if (selection.isEmpty) {
                    const messageOptions = {...expandedMessageOptions};
                    messageOptions.detail = 'Please select text before using last configuration.';
                    vscode.window.showInformationMessage('Please select content to convert', messageOptions);
                    return;
                }
                
                const selectedText = textEditor.document.getText(selection);

                // Show the available configurations
                const configOptions = [
                    { label: 'CSV Format', key: LAST_USED_CSV_CONFIG },
                    { label: 'Comma Separated Line', key: LAST_USED_COMMA_LIST_CONFIG },
                    { label: 'SQL Table', key: LAST_USED_SQL_TABLE_CONFIG }
                ].filter(option => context.globalState.get(option.key) !== undefined);

                if (configOptions.length === 0) {
                    vscode.window.showInformationMessage('No saved configurations found. Please use other commands first.');
                    return;
                }

                const selectedConfig = await vscode.window.showQuickPick(
                    configOptions,
                    { placeHolder: 'Select a saved configuration to use' }
                );

                if (!selectedConfig) {
                    return; // User cancelled
                }

                const config = context.globalState.get(selectedConfig.key);
                
                // Process based on the configuration type
                if (selectedConfig.key === LAST_USED_CSV_CONFIG) {
                    const csvText = convertListToCSV(selectedText, config as ConversionOptions);
                    textEditor.edit(edit => {
                        edit.replace(selection, csvText);
                    });
                    vscode.window.showInformationMessage('List converted to CSV using last configuration');
                    
                } else if (selectedConfig.key === LAST_USED_COMMA_LIST_CONFIG) {
                    const result = convertToCommaLine(selectedText, config as CommaListOptions);
                    await vscode.env.clipboard.writeText(result);
                    vscode.window.showInformationMessage('List converted to comma-separated line using last configuration and copied to clipboard');
                    
                } else if (selectedConfig.key === LAST_USED_SQL_TABLE_CONFIG) {
                    const sqlConfig = config as SqlTableOptions;
                    
                    // Parse the data for preview or SQL generation
                    const { headers, dataLines } = parseSqlTabularData(selectedText, sqlConfig.includeHeaders);
                    
                    if (sqlConfig.previewData) {
                        const previewResult = await showDataPreviewWebview(headers, dataLines, sqlConfig, context);
                        
                        if (previewResult === 'cancelled') {
                            return; // User cancelled after preview
                        }
                    }
                    
                    const sqlStatement = createSqlTableStatement(headers, dataLines, sqlConfig);
                    await vscode.env.clipboard.writeText(sqlStatement);
                    vscode.window.showInformationMessage('SQL table generated using last configuration and copied to clipboard');
                }
                
            } catch (error) {
                const messageOptions = {...expandedMessageOptions};
                messageOptions.detail = `Error details: ${error}`;
                vscode.window.showErrorMessage(`Error applying last used configuration`, messageOptions);
            }
        }
    );

    // Make sure the Sample.HTML file exists in the extension directory
    ensureSampleHtmlExists(context);

    context.subscriptions.push(
        convertToCSVCommand, 
        openSettingsCommand,
        openWebviewCommand,
        convertToCommaLineCommand,
        generateSQLTableCommand,
        saveConfigCommand,
        lastUsedConfigCommand
    );
}

/**
 * Ensure that Sample.HTML exists in the extension directory
 */
function ensureSampleHtmlExists(context: vscode.ExtensionContext) {
    const sampleHtmlPath = path.join(context.extensionPath, 'Sample.HTML');
    
    // If it doesn't exist, we need to create it
    if (!fs.existsSync(sampleHtmlPath)) {
        const currentFilePath = '/home/sidops/personal/VSCode Extensions/list-to-csv/Sample.HTML';
        if (fs.existsSync(currentFilePath)) {
            try {
                fs.copyFileSync(currentFilePath, sampleHtmlPath);
                console.log('Copied Sample.HTML to extension directory');
            } catch (error) {
                console.error('Failed to copy Sample.HTML to extension directory:', error);
            }
        } else {
            console.error('Sample.HTML not found in the workspace');
        }
    }
}

/**
 * Prompt the user for comma-separated line options
 */
async function getCommaLineOptions(): Promise<CommaListOptions | undefined> {
    // Ask about removeDuplicates
    const removeDuplicates = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Remove duplicates?' }
    );

    if (!removeDuplicates) {
        return undefined;
    }

    // Ask about separator
    const separator = await vscode.window.showInputBox({
        prompt: 'Enter separator character',
        value: ',',
        validateInput: value => !value ? 'Separator cannot be empty' : null
    });

    if (!separator) {
        return undefined;
    }

    // Ask about enclosure type
    const enclosureType = await vscode.window.showQuickPick(
        ['Single quotes (\')', 'Double quotes (")'],
        { placeHolder: 'Select enclosure type' }
    );

    if (!enclosureType) {
        return undefined;
    }

    // Ask about SQL IN clause
    const sqlInClause = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Format as SQL IN clause?' }
    );

    if (!sqlInClause) {
        return undefined;
    }

    const options = {
        removeDuplicates: removeDuplicates === 'Yes',
        separator,
        enclosure: enclosureType.startsWith('Single') ? "'" : '"',
        sqlInClause: sqlInClause === 'Yes'
    };
    
    // Save as last used configuration
    vscode.commands.executeCommand('_listToCSV.saveLastUsedConfig', LAST_USED_COMMA_LIST_CONFIG, options);
    
    return options;
}

/**
 * Convert list text to comma-separated line
 */
function convertToCommaLine(text: string, options: CommaListOptions): string {
    // Split text into lines and remove empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('No valid list items found');
    }
    
    // Remove duplicates if specified
    let processedLines = options.removeDuplicates ? [...new Set(lines)] : lines;
    
    // Format lines with enclosures
    const formattedLines = processedLines.map(line => 
        `${options.enclosure}${line}${options.enclosure}`
    );
    
    // Join with separator
    let result = formattedLines.join(options.separator);
    
    // Add SQL IN clause wrapper if specified
    if (options.sqlInClause) {
        result = `IN (${result})`;
    }
    
    return result;
}

/**
 * Get conversion options from settings
 */
function getConversionOptions(): ConversionOptions {
    const config = vscode.workspace.getConfiguration('list-to-csv');
    
    const options = {
        delimiter: config.get<string>('delimiter', ','),
        includeHeaders: config.get<boolean>('includeHeaders', true),
        quoteAllFields: config.get<boolean>('quoteAllFields', false),
        escapeCharacter: config.get<string>('escapeCharacter', '"'),
    };
    
    // Save as last used configuration
    vscode.commands.executeCommand('_listToCSV.saveLastUsedConfig', LAST_USED_CSV_CONFIG, options);
    
    return options;
}

/**
 * Convert list text to CSV format
 */
function convertListToCSV(text: string, options: ConversionOptions): string {
    // Split text into lines and remove empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('No valid list items found');
    }
    
    // Detect list type and parse items accordingly
    const parsedItems = parseListItems(lines);
    
    // Convert to CSV format
    return generateCSV(parsedItems, options);
}

/**
 * Parse list items based on the detected format
 */
function parseListItems(lines: string[]): string[][] {
    // Try to determine the list type (bullet, numbered, etc.)
    const listType = detectListType(lines);
    const result: string[][] = [];
    
    for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) {
            continue;
        }
        
        let content: string = '';
        
        // Extract content based on list type
        switch (listType) {
            case 'bullet':
                // Match common bullet point formats: *, -, •, etc.
                content = trimmedLine.replace(/^[\s]*[•\*\-\+\>\◦◘○◙■]\s+/, '');
                break;
                
            case 'numbered':
                // Match numbered list formats: 1., 1), (1), etc.
                content = trimmedLine.replace(/^[\s]*(?:\d+[\.:\)\]\-]|\(\d+\))\s+/, '');
                break;
                
            case 'none':
            default:
                content = trimmedLine;
        }
        
        // Split the content by common separators (tab, multiple spaces, etc.)
        const parts = content.split(/\s{2,}|\t/).map(part => part.trim()).filter(Boolean);
        result.push(parts);
    }
    
    return result;
}

/**
 * Detect the list type from the input lines
 */
function detectListType(lines: string[]): 'bullet' | 'numbered' | 'none' {
    // Check first few lines to determine the format
    const sampleLines = lines.slice(0, Math.min(3, lines.length));
    
    // Check for bullet points
    const bulletPattern = /^[\s]*[•\*\-\+\>\◦◘○◙■]\s+/;
    const isBulletList = sampleLines.some(line => bulletPattern.test(line));
    
    if (isBulletList) {
        return 'bullet';
    }
    
    // Check for numbered list
    const numberedPattern = /^[\s]*(?:\d+[\.:\)\]\-]|\(\d+\))\s+/;
    const isNumberedList = sampleLines.some(line => numberedPattern.test(line));
    
    if (isNumberedList) {
        return 'numbered';
    }
    
    return 'none';
}

/**
 * Generate CSV content from parsed items
 */
function generateCSV(items: string[][], options: ConversionOptions): string {
    if (items.length === 0) {
        return '';
    }
    
    const result: string[] = [];
    
    // Determine the maximum number of columns
    const maxColumns = items.reduce((max, item) => Math.max(max, item.length), 0);
    
    // Add headers if specified
    if (options.includeHeaders) {
        const headers = Array.from({ length: maxColumns }, (_, i) => `Column ${i + 1}`);
        result.push(formatCSVRow(headers, options));
    }
    
    // Add data rows
    for (const item of items) {
        // Pad with empty strings if needed to match maxColumns
        const paddedItem = [...item];
        while (paddedItem.length < maxColumns) {
            paddedItem.push('');
        }
        
        result.push(formatCSVRow(paddedItem, options));
    }
    
    return result.join('\n');
}

/**
 * Format a row for CSV output
 */
function formatCSVRow(row: string[], options: ConversionOptions): string {
    return row.map(cell => formatCSVCell(cell, options)).join(options.delimiter);
}

/**
 * Format a cell for CSV output with proper escaping
 */
function formatCSVCell(cell: string, options: ConversionOptions): string {
    const { quoteAllFields, escapeCharacter } = options;
    
    // Replace any escapeCharacter with doubled escapeCharacter
    let escaped = cell.replace(new RegExp(escapeCharacter, 'g'), escapeCharacter + escapeCharacter);
    
    // Determine if we need to quote the cell
    const needsQuotes = quoteAllFields || 
        cell.includes(options.delimiter) || 
        cell.includes('\n') || 
        cell.includes(escapeCharacter);
    
    return needsQuotes ? `${escapeCharacter}${escaped}${escapeCharacter}` : escaped;
}

/**
 * Prompt the user for SQL table options
 */
async function getSqlTableOptions(): Promise<SqlTableOptions | undefined> {
    // Ask for table name
    const tableName = await vscode.window.showInputBox({
        prompt: 'Enter table name',
        value: 'my_table',
        validateInput: value => !value ? 'Table name cannot be empty' : null
    });

    if (!tableName) {
        return undefined;
    }

    // Ask about SQL dialect
    const sqlDialect = await vscode.window.showQuickPick(
        [
            { label: 'MS SQL Server', value: 'mssql' },
            { label: 'MySQL', value: 'mysql' },
            { label: 'PostgreSQL', value: 'postgres' },
            { label: 'Spark SQL', value: 'spark' }
        ],
        { placeHolder: 'Select SQL dialect' }
    );

    if (!sqlDialect) {
        return undefined;
    }

    // Ask about data type inference
    const inferDataTypes = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Auto-infer data types?' }
    );

    if (!inferDataTypes) {
        return undefined;
    }

    // Ask about previewing data before generating SQL
    const previewData = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Preview data before generating SQL?' }
    );

    if (!previewData) {
        return undefined;
    }
    
    // Ask if the first row contains headers
    const includeHeaders = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Does your data include column headers in the first row?' }
    );

    if (!includeHeaders) {
        return undefined;
    }

    const options = {
        tableName,
        dialect: sqlDialect.value as 'mssql' | 'mysql' | 'postgres' | 'spark',
        inferDataTypes: inferDataTypes === 'Yes',
        previewData: previewData === 'Yes',
        includeHeaders: includeHeaders === 'Yes'
    };
    
    // Save as last used configuration
    vscode.commands.executeCommand('_listToCSV.saveLastUsedConfig', LAST_USED_SQL_TABLE_CONFIG, options);
    
    return options;
}

/**
 * Generate SQL table creation script from selected text
 */
function generateSqlTableScript(text: string, options: SqlTableOptions): string {
    // Parse the data into headers and rows
    const { headers, dataLines } = parseSqlTabularData(text, options.includeHeaders);
    
    // Generate the SQL table creation script
    return createSqlTableStatement(headers, dataLines, options);
}

/**
 * Create a SQL table creation statement
 */
function createSqlTableStatement(
    headers: string[],
    sampleData: string[][],
    options: SqlTableOptions
): string {
    const { tableName, dialect, inferDataTypes } = options;
    
    // Start building the SQL statement
    let sql = '';
    
    // Add CREATE TABLE clause with proper identifier quoting
    switch (dialect) {
        case 'mssql':
            sql = `CREATE TABLE [${tableName}] (\n`;
            break;
        case 'mysql':
            sql = `CREATE TABLE \`${tableName}\` (\n`;
            break;
        case 'postgres':
            sql = `CREATE TABLE "${tableName}" (\n`;
            break;
        case 'spark':
            sql = `CREATE TABLE ${tableName} (\n`;
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
                sql += `    [${header}] ${dataType}`;
                break;
            case 'mysql':
                sql += `    \`${header}\` ${dataType}`;
                break;
            case 'postgres':
                sql += `    "${header}" ${dataType}`;
                break;
            case 'spark':
                sql += `    ${header} ${dataType}`;
                break;
        }
        
        if (i < headers.length - 1) {
            sql += ',\n';
        } else {
            sql += '\n';
        }
    }
    
    // Close the statement
    sql += ')';
    
    // Add dialect-specific extras
    if (dialect === 'spark') {
        sql += '\nUSING DELTA';
    } else if (dialect === 'mysql') {
        sql += '\nENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    } else if (dialect === 'postgres') {
        sql += ';';
    }
    
    // Add INSERT statements for data
    if (sampleData.length > 0) {
        sql += '\n\n-- Insert data into table\n';
        
        // For batched multi-row inserts, we'll use different approaches based on the dialect
        switch (dialect) {
            case 'mssql':
                // SQL Server doesn't support standard multi-row syntax, but can use table value constructor
                sql += `INSERT INTO [${tableName}] (`;
                
                // Add column names
                for (let j = 0; j < headers.length; j++) {
                    sql += `[${headers[j]}]`;
                    if (j < headers.length - 1) {
                        sql += ', ';
                    }
                }
                
                sql += ') VALUES\n';
                
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
                    sql += '\n';
                }
                break;
                
            case 'mysql':
                // MySQL supports standard multi-row INSERT syntax
                sql += `INSERT INTO \`${tableName}\` (`;
                
                // Add column names
                for (let j = 0; j < headers.length; j++) {
                    sql += `\`${headers[j]}\``;
                    if (j < headers.length - 1) {
                        sql += ', ';
                    }
                }
                
                sql += ') VALUES\n';
                
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
                    sql += '\n';
                }
                sql += ';';
                break;
                
            case 'postgres':
                // PostgreSQL supports standard multi-row INSERT syntax
                sql += `INSERT INTO "${tableName}" (`;
                
                // Add column names
                for (let j = 0; j < headers.length; j++) {
                    sql += `"${headers[j]}"`;
                    if (j < headers.length - 1) {
                        sql += ', ';
                    }
                }
                
                sql += ') VALUES\n';
                
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
                    sql += '\n';
                }
                sql += ';';
                break;
                
            case 'spark':
                // Spark SQL supports standard multi-row INSERT syntax
                sql += `INSERT INTO ${tableName} (`;
                
                // Add column names
                for (let j = 0; j < headers.length; j++) {
                    sql += headers[j];
                    if (j < headers.length - 1) {
                        sql += ', ';
                    }
                }
                
                sql += ') VALUES\n';
                
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
                    sql += '\n';
                }
                break;
        }
    }
    
    return sql;
}

/**
 * Parse selected text into structured tabular data for SQL processing
 * @param text The text to parse
 * @param hasHeaders Whether the first row contains headers (default: true)
 */
function parseSqlTabularData(text: string, hasHeaders: boolean = true): { headers: string[], dataLines: string[][] } {
    // Split text into lines and remove empty lines
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('No valid data found');
    }
    
    // Try to detect if the data is tabular (tab, comma, or pipe separated)
    let separator = detectSeparator(lines[0]);
    
    // Use the first line to get column names or generate default ones
    const firstLine = lines[0];
    let headers: string[] = [];
    let dataLines: string[][] = [];
    
    if (separator) {
        if (hasHeaders) {
            // Data is tabular - first line contains headers
            const rawHeaders = firstLine.split(separator);
            // Create clean headers (non-empty)
            headers = rawHeaders.map((header, index) => {
                const cleaned = header.trim();
                return cleaned === '' ? `Column${index + 1}` : cleaned;
            });
            
            // Process the rest as data rows (starting from second line)
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    // Split the line by separator and handle each cell
                    const rowCells = lines[i].split(separator);
                    const processedCells: string[] = [];
                    
                    // Process each cell in the row, matching with header count
                    for (let j = 0; j < headers.length; j++) {
                        if (j < rowCells.length) {
                            processedCells.push(rowCells[j].trim());
                        } else {
                            // If we have fewer cells than headers, pad with empty strings
                            processedCells.push('');
                        }
                    }
                    
                    dataLines.push(processedCells);
                }
            }
        } else {
            // No headers in data, generate column names and include all lines as data
            const columnCount = firstLine.split(separator).length;
            headers = Array.from({ length: columnCount }, (_, i) => `Column${i + 1}`);
            
            // Process all lines as data (including first line)
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const rowCells = lines[i].split(separator);
                    const processedCells: string[] = [];
                    
                    // Process each cell in the row, matching with header count
                    for (let j = 0; j < headers.length; j++) {
                        if (j < rowCells.length) {
                            processedCells.push(rowCells[j].trim());
                        } else {
                            processedCells.push('');
                        }
                    }
                    
                    dataLines.push(processedCells);
                }
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
            return `Column${index + 1}`;
        }
        
        // Replace invalid characters with underscore
        return header.replace(/[^a-zA-Z0-9_]/g, '_');
    });
    
    return { headers, dataLines };
}

/**
 * Show a data preview in a WebView before generating SQL
 */
async function showDataPreviewWebview(
    headers: string[],
    dataLines: string[][], 
    options: SqlTableOptions,
    context: vscode.ExtensionContext
): Promise<'proceed' | 'cancelled'> {
    return new Promise((resolve) => {
        // Create webview panel
        const panel = vscode.window.createWebviewPanel(
            'dataPreview',
            `Data Preview for ${options.tableName}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );
        
        // Set the HTML content
        panel.webview.html = getPreviewWebviewContent(headers, dataLines, options);
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'proceed':
                        panel.dispose();
                        resolve('proceed');
                        break;
                    case 'cancel':
                        panel.dispose();
                        resolve('cancelled');
                        break;
                }
            }
        );
        
        // Handle panel closing
        panel.onDidDispose(() => {
            resolve('cancelled');
        });
    });
}

/**
 * Generate HTML content for the data preview WebView
 */
function getPreviewWebviewContent(headers: string[], dataLines: string[][], options: SqlTableOptions): string {
    // Generate table rows for preview
    const maxRowsToPreview = 100; // Limit preview rows for performance
    const previewRows = dataLines.slice(0, maxRowsToPreview);
    
    // Count total rows and show message if truncated
    const totalRows = dataLines.length;
    const truncatedMessage = totalRows > maxRowsToPreview 
        ? `<p class="message">Showing ${maxRowsToPreview} of ${totalRows} rows.</p>` 
        : '';

    // Build HTML for table headers
    const tableHeaders = headers.map(h => `<th>${h}</th>`).join('');
    
    // Build HTML for table rows
    const tableRows = previewRows.map(row => {
        const cells = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    // Return the complete HTML
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Data Preview</title>
        <style>
            :root {
                --container-padding: 20px;
                --border-radius: 4px;
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
            
            .container {
                padding: var(--container-padding);
                max-width: 100%;
                margin: 0 auto;
            }
            
            h1 {
                color: var(--vscode-titleBar-activeForeground);
                font-size: 1.5rem;
                margin-bottom: 1rem;
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 0.5rem;
                font-weight: 500;
            }
            
            .table-container {
                overflow: auto;
                max-height: 70vh;
                border: 1px solid var(--vscode-panel-border);
                border-radius: var(--border-radius);
                margin-bottom: 1.5rem;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
            }
            
            th, td {
                padding: 8px 12px;
                text-align: left;
                border: 1px solid var(--vscode-panel-border);
            }
            
            th {
                background-color: var(--vscode-panel-background);
                position: sticky;
                top: 0;
                z-index: 1;
            }
            
            tr:nth-child(even) {
                background-color: var(--vscode-editorWidget-background);
            }
            
            .buttons {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            
            button {
                padding: 8px 16px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: var(--border-radius);
                cursor: pointer;
                font-size: 14px;
            }
            
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .message {
                color: var(--vscode-editorHint-foreground);
                font-style: italic;
            }
            
            .info-section {
                margin-bottom: 20px;
                padding: 12px;
                background-color: var(--vscode-editorWidget-background);
                border-radius: var(--border-radius);
            }
            
            .info-row {
                display: flex;
                margin-bottom: 4px;
            }
            
            .info-label {
                width: 150px;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Data Preview</h1>
            
            <div class="info-section">
                <div class="info-row">
                    <div class="info-label">Table Name:</div>
                    <div>${options.tableName}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">SQL Dialect:</div>
                    <div>${options.dialect.toUpperCase()}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Infer Data Types:</div>
                    <div>${options.inferDataTypes ? 'Yes' : 'No'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Headers Included:</div>
                    <div>${options.includeHeaders ? 'Yes' : 'No'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Column Count:</div>
                    <div>${headers.length}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Row Count:</div>
                    <div>${totalRows}</div>
                </div>
            </div>
            
            ${truncatedMessage}
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>${tableHeaders}</tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            
            <div class="buttons">
                <button id="cancelButton">Cancel</button>
                <button id="proceedButton">Generate SQL</button>
            </div>
        </div>
        
        <script>
            const vscode = acquireVsCodeApi();
            
            document.getElementById('proceedButton').addEventListener('click', () => {
                vscode.postMessage({
                    command: 'proceed'
                });
            });
            
            document.getElementById('cancelButton').addEventListener('click', () => {
                vscode.postMessage({
                    command: 'cancel'
                });
            });
        </script>
    </body>
    </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
