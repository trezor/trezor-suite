# @trezor/suite-desktop-api

Private package providing strongly typed `DesktopApi` used in `@trezor/suite` and `@trezor/suite-desktop`. `DesktopApi` handles [inter-process comumunication](https://www.electronjs.org/docs/latest/tutorial/ipc) inside [Electron](https://www.electronjs.org/) between the `main` context, i.e. native processes running in NodeJS, and `renderer` context, i.e. browser-like processes running on Chromium.

Exported modules:

-   `main` (default) used in `@trezor/suite-desktop/src-electron` in main (NodeJS) context.
-   `renderer` (browser) used in `@trezor/suite` and `@trezor/suite-desktop/src` in renderer context.

```javascript
export function getDesktopApi(ipcRenderer?: Electron.IpcRenderer): DesktopApi;

export const desktopApi: DesktopApi;
```

## Usage examples in main process

-   Overload `electron` types. See [typed-electron.ts](../suite-desktop/src-electron/typed-electron.ts)

-   Create `DesktopApi` instance and expose it to renderer `window.desktopApi` object. See [preload.ts](../suite-desktop/src-electron/preload.ts)

-   Receive invoke messages from renderer. See [metadata module](../suite-desktop/src-electron/modules/metadata.ts)

-   Receive event messages from renderer. See [theme module](../suite-desktop/src-electron/modules/theme.ts)

-   Send event messages to renderer. See `mainWindow.webContents.send` in [autoupdater module](../suite-desktop/src-electron/modules/auto-updater.ts)

## Usage examples in renderer process

-   `DesktopApi.invoke`. See [metadata module](../suite/src/services/suite/metadata/FileSystemProvider.ts)

-   `DesktopApi.on`. See [AutoUpdater component](../suite-desktop/src/support/DesktopUpdater.tsx)

-   `DesktopApi.send`. See [metadata module](../suite-desktop/src-electron/src/index.ts)

## How to add new method/channel

To invoke a method on the `main` process and return an asynchronous result to the `renderer` process

-   add a channel to `./src/api.ts InvokeChannels`
-   add a method to `./src/api.ts DesktopApi` as `DesktopApiInvoke<'your-new-channel'>`
-   process incoming request in `@trezor/suite-desktop/src-electron/modules/*` using `ipcMain.handle('your-new-channel', (arg?: string) => { return 1; })`
-   trigger it from `@trezor/suite` using `const r = await desktopApi.yourNewFunction()`

To receive an asynchronous event in `renderer` process

-   add a channel to `./src/api.ts RendererChannels`
-   set a listener in `@trezor/suite` using `await desktopApi.on('your-new-channel', (payload) => {})`
-   trigger an event from `@trezor/suite-desktop/src-electron/modules/*` using `mainWindow.webContents.send('your-new-channel', { foo: 'bar' })`

To receive an asynchronous event in `main` process

-   add a channel to `./src/api.ts MainChannels`
-   add a method to `./src/api.ts DesktopApi` as `DesktopApiSend<'your-new-channel'>`
-   set a listener in `@trezor/suite-desktop/src-electron/modules/*` using `ipcMain.on('your-new-channel', (_, { foo }) => {})`
-   trigger an event from `@trezor/suite` using `desktopApi.yourNewFunction({ foo: 'bar' })`
