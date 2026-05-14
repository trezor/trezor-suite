import { useEffect } from 'react';

import TrezorConnect, { UI_REQUEST } from '@trezor/connect';

export const useHandleUiRequestPassphraseOnDevice = (callback: () => void) => {
    useEffect(() => {
        TrezorConnect.on(UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE, callback);

        return () => TrezorConnect.off(UI_REQUEST.REQUEST_PASSPHRASE_ON_DEVICE, callback);
    }, [callback]);
};
