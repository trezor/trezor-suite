// TrezorConnect API types tests

import {
    TrezorConnect,
    // Exported types // TODO: breaking change missing ex: EthereumAddress
} from '../../..';

export const init = async (api: TrezorConnect) => {
    const settings = await api.getSettings();
    if (settings.success) {
        const { payload } = settings;
        payload.manifest?.appUrl.toLowerCase();
        if (payload.debug === true) {
            // empty
        }
    }

    api.dispose();
    api.cancel();
    api.cancel('Interruption error');
};
