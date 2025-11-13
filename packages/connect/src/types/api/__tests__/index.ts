// TrezorConnect API types tests

import {
    TrezorConnect,
    // Exported types // TODO: breaking change missing ex: EthereumAddress
} from '../../..';

export const init = async (api: TrezorConnect) => {
    const manifest = { appName: '', appUrl: '', email: '' };
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

    // apiTypes tests - these would be runtime errors if invalid types were passed
    api.init({
        manifest,
        apiTypes: ['usb'],
    });

    api.init({
        manifest,
        apiTypes: ['udp'],
    });

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
};
