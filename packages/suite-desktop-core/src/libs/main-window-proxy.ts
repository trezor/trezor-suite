import { TypedEmitter } from '@trezor/utils';

import { StrictBrowserWindow } from '../typed-electron';

interface MainWindowProxyEvents {
    init: (instance: StrictBrowserWindow) => void;
    destroy: (instance: StrictBrowserWindow) => void;
}

export class MainWindowProxy extends TypedEmitter<MainWindowProxyEvents> {
    private instance?: StrictBrowserWindow;

    setInstance(instance: StrictBrowserWindow) {
        this.destroyInstance();
        this.instance = instance;
        this.emit('init', instance);
    }

    destroyInstance() {
        if (this.instance) {
            this.emit('destroy', this.instance);
            this.instance = undefined;
        }
    }

    getInstance() {
        if (this.instance?.isDestroyed()) {
            this.destroyInstance();
        }

        return this.instance;
    }
}
