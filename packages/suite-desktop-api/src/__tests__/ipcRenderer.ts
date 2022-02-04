import * as EventEmitter from 'events';
import { StrictIpcRenderer } from '../ipc';

class IpcRendererMock extends EventEmitter implements StrictIpcRenderer<any> {
    send(..._args: any[]) {}
    invoke(...args: any[]) {
        return Promise.resolve(args as any);
    }
}

export const ipcRenderer = new IpcRendererMock();
