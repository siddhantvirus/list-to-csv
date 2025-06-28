# List to CSV

<img src="images/icon.png" alt="List to CSV Icon" width="128">

A Visual Studio Code extension to easily convert various list formats into CSV data.

## Features

This extension allows you to convert different types of lists (bullet points, numbered lists, or plain text) into properly formatted CSV data or comma-separated lines. It's particularly useful when you need to:

- Convert bullet point lists to structured CSV data
- Transform numbered lists into spreadsheet-ready formats
- Extract data from lists with consistent formatting
- Prepare list data for import into Excel, Google Sheets, or databases
- Create SQL IN clauses from lists for database queries

### Supported List Types

- Bullet points (*, -, •, etc.)
- Numbered lists (1., 1), (1), etc.)
- Plain text with consistent spacing

### How it works

#### List to CSV Conversion

Select your list in the editor, right-click, and choose "Convert List to CSV" from the context menu:

![Convert List to CSV](https://raw.githubusercontent.com/yourusername/list-to-csv/main/images/demo.gif)

#### Interactive WebView

Open the interactive WebView by:

1. Right-clicking on selected text and choosing "Open List to CSV Converter (WebView)"
2. Using the Command Palette (Ctrl+Shift+P) and typing "Open List to CSV Converter (WebView)"

The WebView provides a user-friendly interface with options for:
- Removing duplicates
- Choosing separators
- Setting quote style (single or double quotes)
- Formatting as SQL IN clause

#### Command Palette Integration

You can also convert lists via the Command Palette:

1. Select your list text
2. Open the Command Palette (Ctrl+Shift+P)
3. Type "Convert List to Comma Separated Line"
4. Follow the prompts to configure your conversion options

## Usage Examples

**Convert a bullet list to CSV:**

```
* Apple Red 1.99
* Banana Yellow 0.99
* Orange Orange 2.49
```

**To CSV output:**
```
Column 1,Column 2,Column 3
Apple,Red,1.99
Banana,Yellow,0.99
Orange,Orange,2.49
```

**Convert list to comma-separated line:**

```
apple
orange
banana
```

**To comma-separated line:**
```
'apple','orange','banana'
```

**Convert list to SQL IN clause:**

```
apple
orange
banana
```

**To SQL IN clause:**
```
IN ('apple','orange','banana')
```

## SQL Table Generation

The extension also provides SQL table generation capabilities:

### Generate SQL Table from Selection

1. Select your tabular data in the editor 
2. Right-click and choose "Generate SQL Table from Selection" or use the Command Palette
3. Enter a table name, select your preferred SQL dialect, and choose whether to infer data types
4. The generated SQL script (both CREATE TABLE and INSERT statements) will be copied to your clipboard

### SQL Dialect Support

- Microsoft SQL Server
- MySQL
- PostgreSQL
- Spark SQL

### Data Type Inference

The extension can automatically infer appropriate data types for columns based on the data:
- Numeric values (integers, decimals)
- Dates and timestamps
- Text values with appropriate length

### Complete SQL Script Generation

The extension generates a complete SQL script that includes:
- CREATE TABLE statement with proper dialect-specific syntax
- INSERT statements for all data rows
- Proper escaping of special characters based on SQL dialect
- AUTO_INCREMENT/IDENTITY or dialect-specific features

### WebView SQL Options

In the WebView interface, you can also:
- Enable the "Generate SQL Table" option
- Configure table name, SQL dialect, and data type inference settings
- Use the "Generate SQL Table & Data" button to create a complete SQL script and preview it

![SQL Table Generation](https://raw.githubusercontent.com/yourusername/list-to-csv/main/images/sql-table-demo.gif)

## Extension Settings

This extension provides the following settings:

* `list-to-csv.delimiter`: Character used to separate fields in the CSV output (default: ",")
* `list-to-csv.includeHeaders`: Include header row in the CSV output (default: true)
* `list-to-csv.quoteAllFields`: Quote all fields in the CSV output, not just those that need it (default: false)
* `list-to-csv.escapeCharacter`: Character used to quote fields in the CSV output (default: ")

You can access these settings by:
1. Opening the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Typing "Open List to CSV Settings"
3. Selecting the extension settings that appear

## Commands

This extension provides the following commands:

* `list-to-csv.convert`: Convert the selected text to CSV format
* `list-to-csv.convertToCommaLine`: Convert the selected text to a comma-separated line (with options for SQL IN clause)
* `list-to-csv.openWebview`: Open the interactive WebView interface
* `list-to-csv.openSettings`: Open the extension settings

## Requirements

No additional requirements or dependencies.

## Release Notes

### 0.0.1

- Initial release
- Support for bullet points, numbered lists, and plain text
- Configurable delimiter, headers, and quoting options
- WebView interface based on Sample.HTML
- SQL IN clause formatting option
- Command palette integration for all features

## Contributing

If you'd like to contribute to this extension, please feel free to submit a pull request or open an issue on the [GitHub repository](https://github.com/yourusername/list-to-csv).

## License

This extension is licensed under the [MIT License](LICENSE).
