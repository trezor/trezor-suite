import { MainChannels, RendererChannels, InvokeChannels } from './api';
import { SendMethod, ListenerMethod, InvokeMethod, HandleMethod } from './methods';

type StrictIpcModule<Module, Channel, Evt = Event> = Omit<
    Module,
    'on' | 'once' | 'removeListener' | 'removeAllListeners'
> & {
    on: ListenerMethod<Channel, Evt>;
    once: ListenerMethod<Channel, Evt>;
    removeListener: ListenerMethod<Channel, Evt>;
    removeAllListeners: (event: keyof Channel) => void;
};

// Module = Omit<Electron.IpcMain, 'handle' | 'handleOnce' | 'removeHandler'>
// Evt = Electron.IpcMainInvokeEvent
export type StrictIpcMain<Module, Evt = Event> = StrictIpcModule<Module, MainChannels> & {
    handle: HandleMethod<InvokeChannels, Evt>;
    handleOnce: HandleMethod<InvokeChannels, Evt>;
    removeHandler: HandleMethod<InvokeChannels, Evt>;
};

// Module = Omit<Electron.IpcRenderer, 'invoke' | 'send'>
// Evt = Electron.Event
export type StrictIpcRenderer<Module, Evt = Event> = StrictIpcModule<Module, RendererChannels> & {
    send: SendMethod<MainChannels, Evt>;
    invoke: InvokeMethod<InvokeChannels, Evt>;
};

// B = Electron.BrowserWindow
// WC = Electron.WebContents
export type StrictBrowserWindow<B, WC> = Omit<B, 'webContents'> & {
    webContents: Omit<WC, 'send'> & {
        send: SendMethod<RendererChannels, Event>;
    };
};
