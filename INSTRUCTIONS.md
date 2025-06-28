# List to CSV Extension - Build & Development Instructions

## Building the Extension for Publishing

### 1. Run the Package Command

```bash
npm run package
```

This script:
1. Checks types using TypeScript
2. Lints your code 
3. Builds your extension using esbuild in production mode (with minification)

### 2. Create the VSIX Package

Install the vsce tool globally if not already installed:

```bash
npm install -g @vscode/vsce
```

Then create the VSIX package:

```bash
vsce package
```

This will create a file named `list-to-csv-0.0.1.vsix` in your project directory.

### 3. Testing the Extension Package (Optional)

#### Option 1: Install via VS Code UI
1. Open VS Code
2. Go to Extensions view (Ctrl+Shift+X)
3. Click on the "..." menu (top-right of Extensions view)
4. Select "Install from VSIX..."
5. Choose your `list-to-csv-0.0.1.vsix` file

#### Option 2: Install via Command Line

```bash
code --install-extension "path/to/list-to-csv-0.0.1.vsix"
```

## Development Notes

### Project Structure

- **src/extension.ts**: Main extension file with command implementations
- **src/listToCSVWebviewProvider.ts**: WebView implementation for the interactive interface
- **src/utils/sqlUtils.ts**: Shared SQL utility functions
- **Sample.HTML**: HTML template for the WebView
- **esbuild.js**: Bundling configuration

### TypeScript Compilation

- The project uses a dual compilation approach:
  - TypeScript (`tsc`) for type checking only with `--noEmit`
  - esbuild for actual bundling into `dist/extension.js`

- The `outDir` setting in tsconfig.json is set to "out" but only applies to test compilation, not the main build process

### Build Scripts

- `npm run compile`: Development build
- `npm run watch`: Watch for changes during development
- `npm run package`: Production build for publishing
- `npm run lint`: Run ESLint
- `npm run check-types`: Run TypeScript type checking

## Future Enhancements

1. Fix SQL generation after data preview
2. Make data preview optional with a configuration setting
3. Add option to specify if headers are included in the selected data
4. Create a dedicated WebView for pasting tabular data to create SQL tables
