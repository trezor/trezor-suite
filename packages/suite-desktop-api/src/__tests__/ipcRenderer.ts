import { EventEmitter } from 'events';
import { StrictIpcRenderer } from '../ipc';
import type { IpcRendererEvent } from 'electron';

class IpcRendererMock extends EventEmitter implements StrictIpcRenderer<any, IpcRendererEvent> {
    send(..._args: any[]) {}
    invoke(...args: any[]) {
        return Promise.resolve(args as any);
    }
}

export const ipcRenderer = new IpcRendererMock();
