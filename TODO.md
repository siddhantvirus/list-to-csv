# List to CSV Extension - TODO List

## High Priority

1. **Fix SQL Generation After Data Preview**
   - Issue: Currently unable to generate SQL after confirming in the data preview
   - Root cause: The WebView message handling for the preview confirmation needs fixing
   - Solution: Update the message handler to properly process 'proceed' messages

2. **Make Data Preview Optional**
   - Add configuration option to bypass data preview for quick SQL generation
   - Update the SQL generation command to respect this setting
   - Add a checkbox in WebView and command prompt options

3. **Add Header Detection Option**
   - Add option to specify if the selected data already includes headers
   - If no headers are present, generate default column names
   - Add this option to both WebView and command prompt interfaces

## Medium Priority

1. **Create Dedicated Data Import WebView**
   - Implement a new WebView specifically for pasting tabular data
   - Provide options for delimiter detection, header specification
   - Allow direct pasting from Excel, CSV files, or other tabular sources
   - Generate SQL tables from the pasted data

2. **Improve Column Type Inference**
   - Enhance the data type detection algorithm for better accuracy
   - Support more specialized data types (e.g., UUID, JSON, etc.)
   - Allow manual override of inferred types

3. **Add More SQL Dialects**
   - Oracle Database
   - SQLite
   - BigQuery
   - Snowflake

4. **Implement Schema Support**
   - Add option to specify database schema
   - Support schema syntax for different SQL dialects

## Low Priority

1. **Add Table Customization Options**
   - Primary key specification
   - Index creation
   - Foreign key constraints
   - Table comments

2. **SQL Export Options**
   - Export to file
   - Copy to clipboard in different formats (SQL script, JSON, etc.)
   - Split large SQL files into multiple statements

3. **Beautify Output**
   - Add syntax highlighting for generated SQL
   - Provide formatting options (compact vs. expanded)

4. **Performance Optimizations**
   - Optimize large data handling
   - Implement batch processing for very large datasets

## Potential Feature Ideas

1. **Data Transformation Options**
   - Case conversion (upper/lower/title case)
   - Trim whitespace
   - Apply regex transformations
   - Date format conversion

2. **Integration with Database Extensions**
   - Execute generated SQL directly if database extension is installed
   - Preview actual execution plan

3. **Template System**
   - Save and reuse conversion configurations
   - Custom templates for different SQL dialects


SQL generate Table is not working on view.
Last Used Setting is now removed.
Save it as .sql file if needed
Image is not showing up

We need to be able to use multi-row inserts, instead of multiple insert statements.

Overrall, let's also make sure that the user does not feel bombarded with excess options in the command pallete and right click menu, 

Should we be having helper functions or breakdown into multiple components to make sure extension.ts and webview are not having  the code re-used twice, or is it necessary to make sure that it does not really cause any issues ?
I will be ultimately bundling using esbuild so I just don't want bundle size to exceed.

Also, in the extension and not in the webview, I believe I was earlier able to create csv with seperate columns. That seems to have gone and it is n

I want the functionality of converting to single line reserved only for 