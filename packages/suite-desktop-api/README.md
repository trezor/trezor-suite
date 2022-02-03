# @trezor/suite-desktop-api

Private package provides strongly typed `DesktopApi` used in `@trezor/suite` and `@trezor/suite-desktop`

Exported modules:

- `main` (default) used in `@trezor/suite-desktop/src-electron` in main (nodejs) context.
- `renderer` (browser) used in `@trezor/suite` and `@trezor/suite-desktop/src` in renderer context.

```javascript
export function getDesktopApi(ipcRenderer?: Electron.IpcRenderer): DesktopApi;

export const desktopApi: DesktopApi;
```

## Usage examples in main process

- Overload `electron` types. see [typed-electron.ts](../suite-desktop/src-electron/typed-electron.ts)

- Create `DesktopApi` instance and expose it to renderer `window.desktopApi` object. see [preload.ts](../suite-desktop/src-electron/preload.ts)

- Receive invoke messages from renderer. see [metadata module](../suite-desktop/src-electron/modules/metadata.ts)

- Receive event messages from renderer. see [theme module](../suite-desktop/src-electron/modules/theme.ts)

- Send event messages to renderer. see `mainWindow.webContents.send` in [autoupdater module](../suite-desktop/src-electron/modules/auto-updater.ts)

## Usage examples in renderer process

- `DesktopApi.invoke`. see [metadata module](../suite/src/services/suite/metadata/FileSystemProvider.ts)

- `DesktopApi.on`. see [AutoUpdater component](../suite-desktop/src/support/DesktopUpdater.tsx)

- `DesktopApi.send`. see [metadata module](../suite-desktop/src-electron/src/index.ts)

## How to add new method/channel

To invoke method on `main` process and return asynchronous result to `renderer` process
- add channel to `./src/api.ts InvokeChannels`
- add method to `./src/api.ts DesktopApi` as `DesktopApiInvoke<'your-new-channel'>` 
- process incoming request in `@trezor/suite-desktop/src-electron/modules/*` using `ipcMain.handle('your-new-channel', (arg?: string) => { return 1; })`
- trigger it from `@trezor/suite` using `const r = await desktopApi.yourNewFunction()`

To receive asynchronous event in `renderer` process 
- add channel to `./src/api.ts RendererChannels`
- set listener in `@trezor/suite` using `await desktopApi.on('your-new-channel', (payload) => {})`
- trigger event from `@trezor/suite-desktop/src-electron/modules/*` using `mainWindow.webContents.send('your-new-channel', { foo: 'bar' })`

To receive asynchronous event in `main` process 
- add channel to `./src/api.ts MainChannels`
- add method to `./src/api.ts DesktopApi` as `DesktopApiSend<'your-new-channel'>`
- set listener in `@trezor/suite-desktop/src-electron/modules/*` using `ipcMain.on('your-new-channel', (_, { foo }) => {})`
- trigger event from `@trezor/suite` using `desktopApi.yourNewFunction({ foo: 'bar' })`
