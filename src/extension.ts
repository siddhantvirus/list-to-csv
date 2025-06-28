// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface ConversionOptions {
    delimiter: string;
    includeHeaders: boolean;
    quoteAllFields: boolean;
    escapeCharacter: string;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    console.log('Congratulations, your extension "list-to-csv" is now active!');

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
                    vscode.window.showInformationMessage('Please select a list to convert to CSV');
                    return;
                }
                
                const selectedText = textEditor.document.getText(selection);
                
                // Detect the list type and convert to CSV
                const csvText = convertListToCSV(selectedText, options);
                
                // Replace the selected text with the CSV
                edit.replace(selection, csvText);
                
                vscode.window.showInformationMessage('List converted to CSV successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Error converting list to CSV: ${error}`);
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

    context.subscriptions.push(convertToCSVCommand, openSettingsCommand);
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

// This method is called when your extension is deactivated
export function deactivate() {}
