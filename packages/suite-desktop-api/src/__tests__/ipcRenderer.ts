import { EventEmitter } from 'events';
import type { IpcRendererEvent } from 'electron';

import { StrictIpcRenderer } from '../ipc';

class IpcRendererMock extends EventEmitter implements StrictIpcRenderer<any, IpcRendererEvent> {
    send(..._args: any[]) {}
    invoke(...args: any[]) {
        return Promise.resolve(args as any);
    }
}

export const ipcRenderer = new IpcRendererMock();
