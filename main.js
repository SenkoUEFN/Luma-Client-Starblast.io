const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

const createWindow = () => 
    {
    const win = new BrowserWindow(
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
            nodeIntegrationInSubFrames: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    win.webContents.on('did-finish-load', () => 
    {
        const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
        const htmlContent = JSON.stringify(html)
        win.webContents.executeJavaScript(`
            document.open()
            document.write(${htmlContent})
            document.close()
        `)
    })

    win.webContents.openDevTools()
    win.loadURL("https://starblast.io")
}

app.on("ready", () => 
{
    createWindow()
    app.on("window-all-closed", () =>
    {
        if(process.platform !== "darwin")
        {
            app.quit()
        }
    })
})