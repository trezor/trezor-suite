import { useEffect } from 'react';

import TrezorConnect, { UI_EVENTS } from '@trezor/connect';

export const useHandleUiRequestPassphraseOnDevice = (callback: () => void) => {
    useEffect(() => {
        TrezorConnect.on(UI_EVENTS.PASSPHRASE_ON_DEVICE, callback);

        return () => TrezorConnect.off(UI_EVENTS.PASSPHRASE_ON_DEVICE, callback);
    }, [callback]);
};
