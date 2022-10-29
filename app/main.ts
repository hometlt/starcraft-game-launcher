import 'v8-compile-cache'
import {app, BrowserWindow, ipcMain, screen, dialog, Notification} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {Installer} from "./installer";

let isWindows = process.platform === "win32";
let win: BrowserWindow = null;
let send: (channel: string, ...args: any[]) => void;
let notification = function(options){ new Notification(options).show();}
const args = process.argv.slice(1), serve = args.some(val => val === '--serve');

try {
  // Windows
  {
    function createWindow(): BrowserWindow {

      const size = screen.getPrimaryDisplay().workAreaSize;

      // Create the browser window.
      win = new BrowserWindow({
        x: 0,
        y: 0,
        width: 1050,
        height: 700,
        frame: false,
        minWidth: 1050,
        minHeight: 700,
        transparent: true,
        webPreferences: {
          nodeIntegration: true,
          allowRunningInsecureContent: (serve),
          contextIsolation: false,  // false if you want to run e2e test with Spectron
        },
      });
      send = win.webContents.send.bind(win.webContents)

      if (serve) {
        const debug = require('electron-debug');
        debug();
        require('electron-reloader')(module);
        win.loadURL('http://localhost:4200');
      } else {
        // Path when running electron executable
        let pathIndex = './index.html';
        if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
          // Path when running electron in local folder
          pathIndex = '../dist/index.html';
        }
        const url = new URL(path.join('file:', __dirname, pathIndex));
        win.loadURL(url.href);
      }

      // Emitted when the window is closed.
      win.on('closed', () => {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null;
      });

      win.webContents.session.webRequest.onHeadersReceived({ urls: [ "*://*/*" ] },
        (d, c)=>{
          delete d.responseHeaders['content-security-policy'];
          delete d.responseHeaders['cross-origin-opener-policy'];
          delete d.responseHeaders['referrer-policy'];
          delete d.responseHeaders['x-frame-options'];
          c({cancel: false, responseHeaders: d.responseHeaders});
        }
      );

      return win;
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    // Added 400 ms to fix the black bacфground issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
    app.on('ready', () => setTimeout(createWindow, 400));

    // Quit when all windows are closed.
    app.on('window-all-closed', () => {
      // On OS X it is common for applications and their menu bar
      // to stay active until the user quits explicitly with Cmd + Q
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (win === null) {
        createWindow();
      }
    });

    let storedBounds ;
    ipcMain.handle('app:window-close', (event) => {
      win.close()
    })
    ipcMain.handle('app:window-minimize', (event) => {
      win.minimize()
    })
    ipcMain.handle('app:window-maximize', (event) => {
      win.setResizable(false)
      storedBounds = win.getBounds()
      win.maximize()
    })
    ipcMain.handle('app:window-restore', (event) => {
      win.setBounds(storedBounds)
      win.setResizable(true)
      win.restore()
    })
  }

  let installer = new Installer({
    update: (state)=> {
      send?.('app:installation-update', state);
    }
  })

  // open filesystem dialog to choose files
  ipcMain.handle('app:directory-dialog', async(event) => {
    const directory = dialog.showOpenDialogSync({
      properties: ['openDirectory'],
      defaultPath: installer.directory
    });
    if (directory !== undefined) {
      installer.setDirectory(directory[0])
    }
  });

  // Version selected
  ipcMain.handle('app:game-directory-open', async(event) => {
    await installer.openGameDirectory()
  })
  // Version selected
  ipcMain.handle('app:mod-directory-open', async(event) => {
    await installer.openModDirectory()
  })

  ipcMain.handle('app:set-version', async(event,version) => {
    await installer.setVersion(version)
  })

  ipcMain.handle('app:install-cancel', async (event) => {
    installer.cancel()
  });

  ipcMain.handle('app:install-game', async (event) => {

    send('app:installation-init', {});

    await installer.install({
      // onInstallBegin: (e) => send('app:installation-start', {}),
      // onUploadingProgress: (e,f) => send('app:downloading-progress', f),
      // onUploadingComplete: (e,f) => send('app:downloading-complete', f),
      // onInstallError: (e,f) => send('app:downloading-error', f),
      onInstallComplete: (e) => {
        send('app:installation-complete', {});
        notification({title: 'Installation Complete', body: `Installation Complete`})
      }
    })
  })

  ipcMain.handle('app:initialize', (event) => {
    installer.update()
  })
  ipcMain.handle('app:start-game', (event) => {
    installer.run()
  })

} catch (e) {
  // Catch Error
  // throw e;
}
