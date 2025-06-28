# List to CSV

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

## Extension Settings

This extension provides the following settings:

### CSV Conversion Settings

* `list-to-csv.delimiter`: Character used to separate fields in the CSV output (default: ",")
* `list-to-csv.includeHeaders`: Include header row in the CSV output (default: true)
* `list-to-csv.quoteAllFields`: Quote all fields in the CSV output, not just those that need it (default: false)
* `list-to-csv.escapeCharacter`: Character used to quote fields in the CSV output (default: ")

### Line Conversion Settings

* `list-to-csv.line.removeDuplicates`: Remove duplicate entries when converting to comma-separated line (default: false)
* `list-to-csv.line.separator`: Character used to separate items in comma-separated line output (default: ",")
* `list-to-csv.line.enclosure`: Character used to enclose items in comma-separated line output (default: ')
* `list-to-csv.line.sqlInClause`: Format output as SQL IN clause (default: false)

You can access these settings by:
1. Opening the Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Typing "Open List to CSV Settings"
3. Selecting the extension settings that appear

## Commands

This extension provides the following commands:

* `list-to-csv.convert`: Convert the selected text to CSV format
* `list-to-csv.convertToCommaLine`: Convert the selected text to a comma-separated line (with interactive options)
* `list-to-csv.convertToCommaLineWithDefaults`: Convert the selected text using default line conversion settings
* `list-to-csv.convertToCommaLineWithLastUsed`: Convert the selected text using the last used line conversion settings
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
