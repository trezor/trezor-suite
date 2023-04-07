# @trezor/ipc-proxy

This package is designed to reflect interface of any EventEmitter-like class or object and implement it in the same way in both web and electron builds.

Create [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) instance to replace default interface.

Each proxy instance is using own unique ipc channel to communicate with unique instance of EventEmitter-like class on main context.

Each proxy method is using electron [ipcRenderer](https://www.electronjs.org/docs/latest/api/ipc-renderer) to send the requests between renderer and main contexts.

Each proxy method is async.

## When to use it?

When you want to have different implementations of the same interface in electron and web builds, where electron implementation is working in main (nodejs) context and web implementation is working in default DOM context.

Usage examples: @trezor/connect and @trezor/coinjoin in @trezor/suite-desktop

<strike>`ipcRenderer.on` listener callback function contains additional param at position 0. (Electron.IpcRendererEvent)
web callback implementations are not expecting this param therefore `real listener function` needs to be wrapped by another function to strip this param.
both `real` and `wrapped` listeners references are stored in electron preload context and used as accordingly.</strike> _Not true, since 1.0.1 listeners are stored in renderer context_

using `ipcRenderer.invoke` and `ipcRenderer.on` event listener and may results with race conditions (possible electron bug)
expected: set-listener > START > progress > progress > progress > RESULT
received: set-listener > START > progress > progress > RESULT > progress

## Usage example

electron-preload.js

Exposes proxy channel generator to `window` object. Generator used in `createIpcProxy` (renderer context)

```
import { contextBridge, ipcRenderer } from 'electron';
import { exposeIpcProxy } from '@trezor/ipc-proxy';

contextBridge.exposeInMainWorld(...exposeIpcProxy(ipcRenderer, ['MyClassChannelName']));
```

electron-main.js:

Setup channel listeners, handle messages from the renderer context

Returns function to clean up all listeners

```
import { app, ipcMain } from 'electron';
import { createIpcProxyHandler } from '@trezor/ipc-proxy';
import { MyClass } from 'my-class-package';

const unregisterProxy = createIpcProxyHandler<MyClass>(
    ipcMain,
    'MyClassChannelName',
    {
        // constructor-like class, called after createIpcProxy
        onCreateInstance: (settings: ConstructorParameters<typeof MyClass>[0]) => {
            const myClassInstance = new MyClass(settings);
            return {
                // method request
                onRequest: (method, params) => {
                    if (method === 'init') {
                        // more custom actions here ...
                        return myClassInstance.init(...params);
                    }
                    return (myClassInstance[method] as any)(...params);
                },
                // event listener requests
                onAddListener: (eventName, listener) => {
                    return myClassInstance.on(eventName, listener);
                },
                onRemoveListener: eventName => {
                    return myClassInstance.removeAllListeners(eventName);
                },
            };
        },
    },
);
app.on('before-quit', unregisterProxy);
```

electron-renderer.js:

Create proxy instance in renderer context and use it as regular _MyClass_ instance

```
import { MyClass } from 'my-class-package';
import { createIpcProxy } from '@trezor/ipc-proxy';

const initService = () {
    if (isDesktopBuild) {
        return createIpcProxy<MyClass>('MyClassChannelName', { defaultField: 'foo' }, { myClassConstructorArg: 1 });
    }
    return new MyClass({ myClassConstructorArg: 1 });
}

const getData = async () => {
    const myClassInstance = await initService();

    const progressHandler = progress => {
        // handle progress
    }

    myClassInstance.on('progress', progressHandler)
    const response = await myClassInstance.getDataWithProgress(1);
    myClassInstance.off('progress', progressHandler);
    return response;
}


```
