import { useEffect } from 'react';

import TrezorConnect, { UI } from '@trezor/connect';

export const useHandleUiRequestPassphraseOnDevice = (callback: () => void) => {
    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE_ON_DEVICE, callback);

        return () => TrezorConnect.off(UI.REQUEST_PASSPHRASE_ON_DEVICE, callback);
    }, [callback]);
};
