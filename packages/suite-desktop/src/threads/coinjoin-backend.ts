import { createInterceptor } from '@trezor/request-manager';
import { CoinjoinBackend, CoinjoinBackendSettings } from '@trezor/coinjoin';
import { isDevEnv } from '@suite-common/suite-utils';

import { createThread } from '../libs/thread';

type BackgroundCoinjoinBackendSettings = CoinjoinBackendSettings & {
    torSettings: TorSettings;
};

/**
 * Extending CoinjoinBackend class is kind of ugly hack
 * which nevertheless allows us to easily receive
 * `setTorSettings` messages from main process using ThreadProxy
 */
class BackgroundCoinjoinBackend extends CoinjoinBackend {
    torSettings;

    constructor({ torSettings, ...settings }: BackgroundCoinjoinBackendSettings) {
        super(settings);
        this.torSettings = torSettings;
    }

    public setTorSettings(torSettings: TorSettings) {
        this.torSettings = torSettings;
    }
}

const init = (settings: BackgroundCoinjoinBackendSettings) => {
    const backend = new BackgroundCoinjoinBackend(settings);

    createInterceptor({
        handler: () => {},
        getTorSettings: () => backend.torSettings,
        allowTorBypass: isDevEnv,
        whitelistedHosts: ['127.0.0.1', 'localhost', '.sldev.cz'],
    });

    return backend;
};

createThread(init);
