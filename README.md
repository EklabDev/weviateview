# Weaviate Collections Explorer

A desktop application built with Electron to explore your Weaviate collections and inspect the data they hold. This is an Electron port of the [wvsee](https://github.com/rjalexa/wvsee) Next.js project.

## Features

### Collection Management
- **View Collections**: Browse all available Weaviate collections with object counts
- **Create Collections**: Define new collections with custom schemas and properties
- **Delete Collections**: Remove collections with confirmation safety checks
- **Collection Details**: View collection descriptions, property types, and object counts

### Data Exploration
- **Dynamic Tables**: View collection data in responsive tables that adapt to your schema
- **Sorting**: Sort date columns in ascending/descending order
- **Pagination**: Load more objects with pagination support
- **Property Display**: See all properties with their data types and descriptions

### Data Management (CRUD)
- **Create Objects**: Add new objects to collections with type-aware forms
- **Read Objects**: View all objects in a collection with full property details
- **Update Objects**: Edit existing objects by clicking on table rows
- **Delete Objects**: Multi-select and delete objects with confirmation dialogs

### Search Capabilities
- **BM25 Search**: Traditional keyword-based search
- **Vector Search**: Semantic similarity search (requires vectorizer)
- **Hybrid Search**: Combines BM25 and vector search for best results
- **Property Filtering**: Search specific properties or all properties
- **Relevance Scores**: View search result scores for ranking

### Settings & Configuration
- **Local Storage**: Connection settings stored securely using electron-store
- **Connection Management**: Configure Weaviate URL and API keys
- **Connection Testing**: Test your connection before saving
- **Persistent Settings**: Settings persist across application restarts

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A running Weaviate instance

### Development

1. **Install dependencies**:

```bash
npm install
# or
pnpm install
```

2. **Start the development server**:

```bash
npm run dev
# or
pnpm dev
```

This will:
- Build the main Electron process (with watch mode)
- Start the Vite dev server for the renderer
- Launch the Electron app

### Building

Build the application:

```bash
npm run build
# or
pnpm build
```

Then start the built application:

```bash
npm start
# or
pnpm start
```

### Creating Installers

To create distributable installers for your platform:

**First, install electron-builder:**
```bash
npm install
```

**Build installers:**

- **For macOS** (creates `.dmg` file):
  ```bash
  npm run dist:mac
  ```

- **For Windows** (creates `.exe` installer):
  ```bash
  npm run dist:win
  ```

- **For Linux** (creates `.AppImage` and `.deb` files):
  ```bash
  npm run dist:linux
  ```

- **For current platform**:
  ```bash
  npm run dist
  ```

All installers will be created in the `release/` directory.

**Note:** Building installers for other platforms (e.g., building Windows installer on macOS) requires additional setup or CI/CD. For best results, build on the target platform.

## Configuration

### Connection Settings

The application stores your Weaviate connection settings locally:

- **Weaviate URL**: The URL of your Weaviate instance (e.g., `http://localhost:8080`)
- **API Key**: Optional API key for authentication

Settings are stored using `electron-store` and persist across application restarts. You can access the settings dialog from the main interface or on first launch.

### First Run

On first launch, you'll be prompted to configure your Weaviate connection. Click "Configure Connection" and enter:

1. Your Weaviate URL (e.g., `http://localhost:8080`)
2. Your API key (if required)
3. Click "Test Connection" to verify
4. Click "Save" to store the settings

The settings are automatically saved and will be used for all subsequent connections.

## Usage Guide

### Collections Tab

1. **View Collections**: All collections are listed with their object counts
2. **Sort Collections**: Click "Name" or "Objects" buttons to sort
3. **Create Collection**: Click "+ Create Collection" to define a new collection
4. **View Objects**: Click "View Objects" or the collection name to see data
5. **Delete Collection**: Click "Delete" to remove a collection (with confirmation)

### Collection View

1. **Browse Data**: Scroll through objects in the table
2. **Sort Data**: Click date column headers to sort
3. **Create Object**: Click "+ Create Object" to add new data
4. **Edit Object**: Click any table row to edit that object
5. **Delete Objects**: 
   - Click "Delete" to enter selection mode
   - Select objects using checkboxes
   - Click "Delete" again to remove selected objects

### Search Tab

1. **Select Collection**: Choose a collection from the dropdown
2. **Enter Query**: Type your search query
3. **Choose Search Type**:
   - **BM25**: Best for keyword matching
   - **Vector**: Best for semantic similarity (requires vectorizer)
   - **Hybrid**: Combines both approaches
4. **Select Properties** (optional): Choose specific properties to search
5. **Set Limit**: Adjust the number of results
6. **Search**: Click "Search" or press Enter
7. **View Results**: Results show with relevance scores

## Technical Details

### Architecture

- **Main Process**: Electron main process handles window management and IPC
- **Renderer Process**: React application for the UI
- **Preload Script**: Secure bridge between main and renderer processes

### Technology Stack

- **Electron**: Desktop application framework
- **React 19**: UI library with TypeScript
- **TanStack Table**: Data table component
- **Tailwind CSS**: Utility-first CSS framework
- **Weaviate TypeScript Client**: For Weaviate API interactions
- **electron-store**: Local settings persistence
- **Vite**: Build tool for the renderer process

### Project Structure

```
weviateview/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Main entry point
│   │   └── preload.ts  # Preload script
│   └── renderer/       # React application
│       ├── components/ # React components
│       ├── lib/        # Utilities and Weaviate client
│       └── main.tsx    # React entry point
├── icon.png            # Application icon
├── package.json
└── README.md
```

## Important Notes

### ⚠️ Data Safety Warning

**USE AT YOUR OWN RISK**: While this tool is designed for viewing and managing data, any interaction with your Weaviate collections carries inherent risks. There's always a possibility of unintended data modification or loss due to unknown bugs. Please ensure you have proper backups of your Weaviate data before using this tool.

### Supported Weaviate Versions

This application works with Weaviate instances that support:
- GraphQL API (v1)
- REST API (v1)
- Schema management
- BM25, Vector, and Hybrid search

## Troubleshooting

### Connection Issues

- **"Weaviate URL is not configured"**: Go to Settings and configure your connection
- **Connection test fails**: 
  - Verify Weaviate is running
  - Check the URL format (include http:// or https://)
  - Verify API key if authentication is required
  - Check network connectivity

### Search Issues

- **No results found**: 
  - Try a different search type (BM25 vs Vector)
  - Check if the collection has data
  - Verify property names are correct
- **Vector search not working**: Ensure your collection has a vectorizer configured

### Build Issues

- **TypeScript errors**: Run `npm run build:main` to see detailed errors
- **Missing dependencies**: Run `npm install` to ensure all packages are installed

## Development

### Scripts

- `npm run dev`: Start development mode (watch mode + dev server)
- `npm run build`: Build both main and renderer processes
- `npm run build:main`: Build only the main process
- `npm run build:renderer`: Build only the renderer process
- `npm start`: Run the built application
- `npm run lint`: Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Tailwind CSS for styling
- React functional components with hooks

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
