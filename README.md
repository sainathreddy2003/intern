# Retail ERP Client

Desktop client for the Cloud-Sync Retail ERP system built with React and Electron.

## Features

- Modern React-based user interface with Material-UI
- Electron desktop application with offline capabilities
- Real-time POS (Point of Sale) interface
- Keyboard shortcuts for rapid data entry
- Quick cash denomination buttons
- Offline-first architecture with IndexedDB
- Automatic sync when online
- Responsive design for various screen sizes

## Prerequisites

- Node.js 16+
- npm or yarn
- Git

## Installation

1. Clone the repository and navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm start
```

This will start the React development server on `http://localhost:3000`.

## Electron Development

Run the Electron app in development mode:
```bash
npm run electron-dev
```

This will:
1. Start the React development server
2. Launch the Electron application
3. Enable hot reloading and DevTools

## Building for Production

Create a production build:
```bash
npm run build
```

Package the Electron app:
```bash
npm run electron-pack
```

This will create distributable packages in the `dist/` directory for:
- Windows (.exe installer)
- macOS (.dmg)
- Linux (.AppImage)

## Project Structure

```
client/
├── public/                 # Static files and Electron main process
│   ├── electron.js        # Electron main process
│   ├── preload.js         # Preload script for security
│   └── index.html         # HTML template
├── src/
│   ├── components/        # Reusable React components
│   │   ├── Layout.js     # Main app layout
│   │   ├── POS.js        # Point of Sale component
│   │   ├── QuickCashButtons.js
│   │   ├── KeyboardShortcuts.js
│   │   ├── OfflineIndicator.js
│   │   └── ...
│   ├── contexts/          # React contexts for state management
│   │   ├── AuthContext.js
│   │   └── OfflineContext.js
│   ├── pages/             # Main application pages
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── POS.js
│   │   ├── ItemsMaster.js
│   │   ├── Customers.js
│   │   ├── Suppliers.js
│   │   ├── Purchase.js
│   │   ├── Reports.js
│   │   └── Settings.js
│   ├── services/          # API and offline services
│   │   ├── api.js        # API client with axios
│   │   └── offlineDB.js  # IndexedDB wrapper
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── store/             # State management
│   ├── App.js             # Main App component
│   ├── index.js           # App entry point
│   └── index.css          # Global styles
└── package.json
```

## Key Features

### Point of Sale (POS)
- Grid-based item selection
- Real-time cart management
- Customer search and selection
- Multiple payment methods (Cash, Card, Credit, UPI)
- Bill hold and resume functionality
- Quick cash denomination buttons
- Keyboard shortcuts for rapid billing

### Offline Capabilities
- IndexedDB for local data storage
- Automatic sync when online
- Queue system for offline transactions
- Master data download for offline access
- Conflict resolution for sync issues

### Keyboard Shortcuts
- `Ctrl+B` - New Bill
- `Ctrl+H` - Hold Bill
- `Ctrl+S` - Save Bill
- `Ctrl+P` - Purchase Entry
- `Ctrl+E` - Day End Process
- `Ctrl+D` - Download from Server
- `Ctrl+U` - Upload to Server
- `F1` - Toggle keyboard shortcuts help
- `Escape` - Clear cart/Close dialogs

### Quick Cash Buttons
- Pre-defined denomination buttons (₹2000, ₹500, ₹200, ₹100, etc.)
- Automatic change calculation
- Denomination breakdown
- Custom amount entry

## Configuration

### Environment Variables

Create a `.env` file in the client root:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_VERSION=1.0.0
```

### Electron Configuration

Electron settings are in `public/electron.js`:
- Window size and behavior
- Menu configuration with shortcuts
- Auto-updater settings
- Security preferences

## State Management

The application uses:
- **React Context** for global state (Auth, Offline)
- **React Query** for server state management
- **Zustand** for local component state
- **IndexedDB** for offline data persistence

## API Integration

The client communicates with the server through:
- RESTful API endpoints
- JWT authentication
- Automatic retry logic for failed requests
- Request/response interceptors for error handling

## Offline Architecture

### Data Storage
- **IndexedDB** for client-side storage
- **Dexie.js** as IndexedDB wrapper
- Structured data schema mirroring server

### Sync Strategy
- **Master Data**: Downloaded periodically (items, customers, suppliers)
- **Transactions**: Queued locally and synced when online
- **Conflict Resolution**: Last-write-wins with manual override options

### Offline Queue
- Transaction queue with retry logic
- Exponential backoff for failed syncs
- Status tracking (Pending, Synced, Error)

## Security

- **Context Isolation**: Secure preload scripts
- **Content Security Policy**: Prevent XSS attacks
- **Input Validation**: Client-side validation
- **Token Storage**: Secure localStorage with fallback to IndexedDB

## Performance Optimization

- **Code Splitting**: Lazy loading of routes
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtual Scrolling**: For large lists
- **Image Optimization**: Lazy loading and compression

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Building for Different Platforms

### Windows
```bash
npm run electron-pack -- --win
```

### macOS
```bash
npm run electron-pack -- --mac
```

### Linux
```bash
npm run electron-pack -- --linux
```

## Troubleshooting

### Common Issues

1. **Electron window not loading**
   - Check if React dev server is running on port 3000
   - Verify `public/electron.js` URL configuration

2. **Offline sync not working**
   - Check IndexedDB permissions
   - Verify API URL configuration
   - Check network connectivity

3. **Keyboard shortcuts not working**
   - Ensure Electron window has focus
   - Check for conflicting system shortcuts
   - Verify menu configuration

### Debugging

- **Renderer Process**: Chrome DevTools (F12)
- **Main Process**: `console.log` in terminal
- **Network**: Network tab in DevTools
- **Storage**: Application tab in DevTools

## Contributing

1. Follow the existing code style
2. Use TypeScript for new components (when applicable)
3. Add tests for new features
4. Update documentation
5. Test offline functionality

## Support

For issues and support, please refer to the main project documentation.
