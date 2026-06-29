const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
let launcherWindow
let gameWindow

function createLauncherWindow()
{
    launcherWindow = new BrowserWindow(
        {
            width : 1280,
            height : 720,
            webPreferences : 
            {
                preload : path.join(__dirname, "preload.js")
            }
        }
    )
    const launcherHtml = path.join(__dirname, "renderer", "launcher.html")
    launcherWindow.loadFile(launcherHtml)
    app.on("launcherWindow-all-closed", () =>
    {
        if(process.platform !== "darwin")
        {
            app.quit()
        }
    })
    launcherWindow.webContents.openDevTools()
}

ipcMain.handle("startGame",startGame)

function startGame()
{   
    if(launcherWindow)
    {
        launcherWindow.close()
        launcherWindow = null
    }
    createGameWindow()
}

function createGameWindow()
{

    gameWindow = new BrowserWindow(
    {
        width: 1280,
        height: 720,
        fullscreen: true,
        frame: false,
        webPreferences: 
        {
            autoplayPolicy: 'no-user-gesture-required',
            nodeIntegration: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            contextIsolation: true,
            nodeIntegrationInSubFrames: true
        },
    })

    gameWindow.webContents.on('did-finish-load', () => 
    {
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
        const htmlContent = JSON.stringify(html)
        gameWindow.webContents.executeJavaScript(`
            document.open()
            document.write(${htmlContent})
            document.close()
        `)
    })

    gameWindow.webContents.openDevTools()
    gameWindow.loadURL("https://starblast.io/")

    app.on("window-all-closed", () =>
    {
        if(process.platform !== "darwin")
        {
            app.quit()
        }
    })
    
}

async function onBegin()
{
    createLauncherWindow()
}


app.on("ready", onBegin)