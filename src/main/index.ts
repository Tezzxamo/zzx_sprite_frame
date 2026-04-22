import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
// 不使用 @electron-toolkit/utils，使用原生 API
import { registerVideoHandlers } from './videoHandler'
import { registerExportHandlers } from './exportHandler'
// IPC channels registered in handlers

// 窗口引用，防止垃圾回收
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'ZZX SpriteFrame - 视频转序列帧工具',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 加载页面
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // 设置应用用户模型 ID（Windows 任务栏）
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.tezzxamo.zzx-sprite-frame')
  }

  // 注册 IPC 处理器
  registerVideoHandlers()
  registerExportHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 处理拖拽文件到应用
app.on('open-file', (event, path) => {
  event.preventDefault()
  if (mainWindow) {
    mainWindow.webContents.send('app:open-file', path)
  }
})
