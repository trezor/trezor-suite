// TrezorConnect API types tests

import {
    TrezorConnect,
    // Exported types // TODO: breaking change missing ex: EthereumAddress
} from '../../..';

export const init = async (api: TrezorConnect) => {
    const manifest = { appUrl: '', email: '' };
    api.init({ manifest });
    // @ts-expect-error
    api.init();
    // @ts-expect-error
    api.init({});
    // @ts-expect-error
    api.manifest({});
    // @ts-expect-error
    api.manifest({ appUrl: 1 });
    // @ts-expect-error
    api.manifest({ email: 1 });

    const settings = await api.getSettings();
    if (settings.success) {
        const { payload } = settings;
        payload.manifest?.appUrl.toLowerCase();
        payload.connectSrc?.toLowerCase();
        if (payload.debug === true && payload.popup === true) {
            //
        }
    }

    api.dispose();
    api.cancel();
    api.cancel('Interruption error');
    api.renderWebUSBButton();
    api.disableWebUSB();
};
