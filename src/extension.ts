// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ListToCSVWebviewProvider } from './listToCSVWebviewProvider';
import * as fs from 'fs';
import * as path from 'path';

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
}

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
                
                // Generate SQL table creation script
                const sqlStatement = generateSqlTableScript(selectedText, options);
                
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

    // Make sure the Sample.HTML file exists in the extension directory
    ensureSampleHtmlExists(context);

    context.subscriptions.push(
        convertToCSVCommand, 
        openSettingsCommand,
        openWebviewCommand,
        convertToCommaLineCommand,
        generateSQLTableCommand
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

    return {
        removeDuplicates: removeDuplicates === 'Yes',
        separator,
        enclosure: enclosureType.startsWith('Single') ? "'" : '"',
        sqlInClause: sqlInClause === 'Yes'
    };
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
    
    return {
        delimiter: config.get<string>('delimiter', ','),
        includeHeaders: config.get<boolean>('includeHeaders', true),
        quoteAllFields: config.get<boolean>('quoteAllFields', false),
        escapeCharacter: config.get<string>('escapeCharacter', '"'),
    };
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

    return {
        tableName,
        dialect: sqlDialect.value as 'mssql' | 'mysql' | 'postgres' | 'spark',
        inferDataTypes: inferDataTypes === 'Yes'
    };
}

/**
 * Generate SQL table creation script from selected text
 */
function generateSqlTableScript(text: string, options: SqlTableOptions): string {
    // Split text into lines and remove empty lines
    const lines = text.split(/\\r?\\n/).filter(line => line.trim() !== '');
    
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
            return `Column${index + 1}`;
        }
        
        // Replace invalid characters with underscore
        return header.replace(/[^a-zA-Z0-9_]/g, '_');
    });
    
    // Generate the SQL table creation script
    return createSqlTableStatement(headers, dataLines, options);
}

/**
 * Detect the separator used in data
 */
function detectSeparator(line: string): string | null {
    if (line.includes('\\t')) {
        return '\\t';
    } else if (line.includes(',')) {
        return ',';
    } else if (line.includes('|')) {
        return '|';
    } else if (line.match(/\\s{2,}/)) {
        return ' '; // Use a single space as a marker for multiple spaces
    }
    return null;
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
        
        // Generate INSERT statements for each row
        for (let i = 0; i < sampleData.length; i++) {
            const row = sampleData[i];
            let insertStmt = '';
            
            // Add the INSERT INTO statement with proper quoting for table name
            switch (dialect) {
                case 'mssql':
                    insertStmt = `INSERT INTO [${tableName}] (`;
                    break;
                case 'mysql':
                    insertStmt = `INSERT INTO \`${tableName}\` (`;
                    break;
                case 'postgres':
                    insertStmt = `INSERT INTO "${tableName}" (`;
                    break;
                case 'spark':
                    insertStmt = `INSERT INTO ${tableName} (`;
                    break;
            }
            
            // Add column names
            for (let j = 0; j < headers.length; j++) {
                switch (dialect) {
                    case 'mssql':
                        insertStmt += `[${headers[j]}]`;
                        break;
                    case 'mysql':
                        insertStmt += `\`${headers[j]}\``;
                        break;
                    case 'postgres':
                        insertStmt += `"${headers[j]}"`;
                        break;
                    case 'spark':
                        insertStmt += headers[j];
                        break;
                }
                
                if (j < headers.length - 1) {
                    insertStmt += ', ';
                }
            }
            
            insertStmt += ') VALUES (';
            
            // Add values with proper SQL escaping
            for (let j = 0; j < headers.length; j++) {
                const value = j < row.length ? row[j] : '';
                const formattedValue = formatSqlValue(value, inferDataTypes, dialect);
                
                insertStmt += formattedValue;
                
                if (j < headers.length - 1) {
                    insertStmt += ', ';
                }
            }
            
            insertStmt += ')';
            
            if (dialect === 'postgres' || dialect === 'mysql') {
                insertStmt += ';';
            }
            
            sql += insertStmt + '\n';
        }
    }
    
    return sql;
}

/**
 * Infer SQL data type based on sample data
 */
function inferSqlDataType(sampleData: string[][], columnIndex: number, dialect: string): string {
    // Check sample values to infer the data type
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
            if (maxLength <= 255) { return `VARCHAR(255)`; }
            return 'TEXT';
            
        case 'mysql':
            if (allTimestamps) { return 'DATETIME'; }
            if (allDates) { return 'DATE'; }
            if (allIntegers) { return 'INT'; }
            if (allNumbers) { return 'FLOAT'; }
            if (maxLength <= 255) { return `VARCHAR(255)`; }
            return 'TEXT';
            
        case 'postgres':
            if (allTimestamps) { return 'TIMESTAMP'; }
            if (allDates) { return 'DATE'; }
            if (allIntegers) { return 'INTEGER'; }
            if (allNumbers) { return 'DECIMAL'; }
            if (maxLength <= 255) { return `VARCHAR(255)`; }
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

/**
 * Get default data type for a SQL dialect
 */
function getDefaultDataType(dialect: string): string {
    switch (dialect) {
        case 'mssql': return 'VARCHAR(255)';
        case 'mysql': return 'VARCHAR(255)';
        case 'postgres': return 'VARCHAR(255)';
        case 'spark': return 'STRING';
        default: return 'VARCHAR(255)';
    }
}

/**
 * Format SQL value based on its content and dialect
 */
function formatSqlValue(value: string, inferDataTypes: boolean, dialect: string): string {
    if (!value || value.trim() === '') {
        return 'NULL';
    }
    
    // Try to convert to number
    const num = Number(value);
    if (!isNaN(num) && inferDataTypes) {
        return value;
    }
    
    // Check for date patterns
    const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/;
    const timestampPattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[T\s]\d{1,2}:\d{1,2}(:\d{1,2})?$/;
    
    if ((datePattern.test(value) || timestampPattern.test(value)) && inferDataTypes) {
        if (dialect === 'spark') {
            return `'${value}'`;
        } else if (dialect === 'mssql') {
            return `'${value}'`;
        } else {
            return `'${value}'`;
        }
    }
    
    // Escape single quotes
    const escaped = value.replace(/'/g, "''");
    return `'${escaped}'`;
}

// This method is called when your extension is deactivated
export function deactivate() {}
