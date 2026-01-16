import { useCallback } from 'react';

import { useFocusEffect } from '@react-navigation/native';

import TrezorConnect, { UI } from '@trezor/connect';

export const useWaitForUiRequestPassphraseOnDevice = (callback: () => void) => {
    useFocusEffect(
        useCallback(() => {
            TrezorConnect.on(UI.REQUEST_PASSPHRASE_ON_DEVICE, callback);

            return () => TrezorConnect.off(UI.REQUEST_PASSPHRASE_ON_DEVICE, callback);
        }, [callback]),
    );
};
