# 1.0.1

-   most of the proxy logic was moved from preload context (`exposeIpcProxy` entry point) to renderer context (`createIpcProxy` entry point) which allows to compare listener functions by reference (unlike in preload context)
-   in `window.ipcProxy` there is now exposed only small `IpcProxyApi` object instead of whole proxy factory

# 1.0.0
