const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');


const Store = require('electron-store');

// Initialize electron store
const store = new Store();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Bill',
          accelerator: 'CmdOrCtrl+B',
          click: () => {
            mainWindow.webContents.send('menu-new-bill');
          }
        },
        {
          label: 'Reprint Bill',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu-reprint-bill');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Operations',
      submenu: [
        {
          label: 'Purchase Entry',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow.webContents.send('menu-purchase-entry');
          }
        },
        {
          label: 'Day End Process',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-day-end');
          }
        },
        { type: 'separator' },
        {
          label: 'Download from Server',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.send('menu-download-sync');
          }
        },
        {
          label: 'Upload to Server',
          accelerator: 'CmdOrCtrl+U',
          click: () => {
            mainWindow.webContents.send('menu-upload-sync');
          }
        }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Items Master',
          click: () => {
            mainWindow.webContents.send('menu-items-master');
          }
        },
        {
          label: 'Customers',
          click: () => {
            mainWindow.webContents.send('menu-customers');
          }
        },
        {
          label: 'Suppliers',
          click: () => {
            mainWindow.webContents.send('menu-suppliers');
          }
        },
        { type: 'separator' },
        {
          label: 'Reports',
          click: () => {
            mainWindow.webContents.send('menu-reports');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Retail ERP',
              message: 'Retail ERP v1.0.0',
              detail: 'Cloud-Sync Retail Management System with Offline Capabilities'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App events
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

// Quick cash denominations
ipcMain.handle('quick-cash', (event, amount) => {
  const denominations = [2000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
  const result = {};
  
  let remaining = amount;
  for (const denom of denominations) {
    const count = Math.floor(remaining / denom);
    if (count > 0) {
      result[denom] = count;
      remaining -= count * denom;
    }
  }
  
  return result;
});

// Auto-updater events (for production)
if (!isDev) {
  const { autoUpdater } = require('electron-updater');
  
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. Download will start in the background.',
      buttons: ['OK']
    });
  });
  
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. Restart the application to apply updates.',
      buttons: ['Restart', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}
