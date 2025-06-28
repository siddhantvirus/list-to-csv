# List to CSV

A Visual Studio Code extension to easily convert various list formats into CSV data.

## Features

This extension allows you to convert different types of lists (bullet points, numbered lists, or plain text) into properly formatted CSV data. It's particularly useful when you need to:

- Convert bullet point lists to structured CSV data
- Transform numbered lists into spreadsheet-ready formats
- Extract data from lists with consistent formatting
- Prepare list data for import into Excel, Google Sheets, or databases

### Supported List Types

- Bullet points (*, -, •, etc.)
- Numbered lists (1., 1), (1), etc.)
- Plain text with consistent spacing

### How it works

Select your list in the editor, right-click, and choose "Convert List to CSV" from the context menu:

![Convert List to CSV](https://raw.githubusercontent.com/yourusername/list-to-csv/main/images/demo.gif)

## Usage Examples

**Convert a bullet list:**

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

**Convert a numbered list:**
```
1. Product1 $10.00 In Stock
2. Product2 $25.50 Out of Stock
3. Product3 $5.75 In Stock
```

**To CSV output:**
```
Column 1,Column 2,Column 3
Product1,$10.00,In Stock
Product2,$25.50,Out of Stock
Product3,$5.75,In Stock
```

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

## Requirements

No additional requirements or dependencies.

## Release Notes

### 0.0.1

- Initial release
- Support for bullet points, numbered lists, and plain text
- Configurable delimiter, headers, and quoting options

## Contributing

If you'd like to contribute to this extension, please feel free to submit a pull request or open an issue on the [GitHub repository](https://github.com/yourusername/list-to-csv).

## License

This extension is licensed under the [MIT License](LICENSE).
