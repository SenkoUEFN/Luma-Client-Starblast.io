const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("api",
    {
        startGame : () => ipcRenderer.invoke("startGame")
    }
)

