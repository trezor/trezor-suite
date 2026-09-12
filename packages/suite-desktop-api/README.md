# @trezor/suite-desktop-api

Private package holding the strongly typed `DesktopApi` contract: the
[inter-process communication](https://www.electronjs.org/docs/latest/tutorial/ipc) surface between
Electron's `main` context (Node.js) and its `renderer` context (Chromium).

This package contains **types only**, plus the dependency-injection helpers used to pass an
implementation around. It has no runtime API construction and no environment detection.

## Packages

| Package                              | Contains                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `@trezor/suite-desktop-api`          | The `DesktopApi` contract, channel/message types and `DesktopApiDep` / `selectDesktopApiDep` |
| `@trezor/suite-desktop-api-electron` | `createDesktopApiBridge` (preload side) and `createElectronDesktopApi` (renderer side)       |
| `@trezor/suite-desktop-api-web`      | `createWebDesktopApi`, where every call is unavailable                                       |

Each app's composition root picks one implementation:

```ts
// packages/suite-desktop-ui/src/createSuiteDesktopCompositionRoot.ts
const desktopApi = createElectronDesktopApi();

// packages/suite-web/src/createSuiteWebCompositionRoot.ts
const desktopApi = createWebDesktopApi();
```

## Consuming the API

Never import an implementation package outside a composition root; ESLint enforces this. Take the
API as a dependency instead, narrowed to the methods you actually call.

```ts
// Redux thunk
type MyThunkDeps = WithServices<DesktopApiDep<'appFocus'>>;
// ...
extra.services.desktopApi.appFocus();

// React
const { desktopApi } = useServices(selectDesktopApiDep);
```

## How to add a new method/channel

To invoke a method on the `main` process and return an asynchronous result to the `renderer`

- add a channel to `./src/api.ts InvokeChannels`
- add a channel to validChannels in `../suite-desktop-api-electron/src/validation.ts`
- add a method to `./src/api.ts DesktopApi` as `DesktopApiInvoke<'your-new-channel'>`
- implement it in `../suite-desktop-api-electron/src/createDesktopApiBridge.ts`
- decide the web behaviour in `../suite-desktop-api-web/src/createWebDesktopApi.ts`; that file lists
  every member explicitly, so it will not compile until you do
- process incoming requests in `@trezor/suite-desktop-core/src/modules/*` using `ipcMain.handle(...)`
- call it through an injected `desktopApi`, never through a module-level import

To receive an asynchronous event in the `renderer` process

- add a channel to `./src/api.ts RendererChannels`
- add a channel to validChannels in `../suite-desktop-api-electron/src/validation.ts`
- listen through an injected `desktopApi.on('your-new-channel', payload => {})`
- emit it from `@trezor/suite-desktop-core/src/modules/*` using `mainWindow.webContents.send(...)`

To receive an asynchronous event in the `main` process

- add a channel to `./src/api.ts MainChannels`
- add a channel to validChannels in `../suite-desktop-api-electron/src/validation.ts`
- add a method to `./src/api.ts DesktopApi` as `DesktopApiSend<'your-new-channel'>`
- set a listener in `@trezor/suite-desktop-core/src/modules/*` using `ipcMain.on(...)`
