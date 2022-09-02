/* eslint-disable max-classes-per-file */
import { EventEmitter } from 'events';

class IpcRendererMock extends EventEmitter {
    send(event: string, args: any[]) {
        this.emit('__send', event, args);
    }
    invoke(event: string, ...args: any[]) {
        return new Promise((resolve, reject) => {
            console.warn('invokingggg', event, args);
            this.emit('__invoke', resolve, reject, event, ...args);
        });
    }
}

class IpcMainMock extends EventEmitter {
    renderer: IpcRendererMock;
    invokes: Record<string, any> = {};
    constructor(renderer: IpcRendererMock) {
        super();
        this.renderer = renderer;
    }

    // event listeners may be cleared by tests
    private setup() {
        if (this.renderer.listenerCount('__send') < 1) {
            this.renderer.on('__send', (event, args: any) => {
                console.warn('Sending down', event, ...args);
                this.emit(
                    event,
                    {
                        // [Electron.IpcMainEvent]
                        reply: (event: string, response: any) => {
                            console.warn('...reply', response);
                            this.renderer.emit(event, '[Electron.IpcMainEvent]', response);
                        },
                    },
                    args,
                );
            });
        }
        if (this.renderer.listenerCount('__invoke') < 1) {
            this.renderer.on('__invoke', async (resolve, reject, event, ...args: any[]) => {
                if (!this.invokes[event]) {
                    reject(new Error(`Method ${event} not handled`));
                }
                try {
                    const result = await this.invokes[event]('[Electron.IpcMainEvent]', ...args);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
        }
    }

    handle(event: string, listener: any) {
        this.setup();
        this.invokes[event] = listener;
    }

    on(event: string, listener: any) {
        this.setup();
        return super.on(event, listener);
    }
}

export const ipcRenderer = new IpcRendererMock();
export const ipcMain = new IpcMainMock(ipcRenderer);

export const exposeInMainWorld = (name: string, obj: any) => {
    // @ts-expect-error
    window[name] = obj;
};
