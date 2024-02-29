import { useEffect, useState } from 'react';

import { useAtom, useAtomValue } from 'jotai';

import TrezorConnect, { UI } from '@trezor/connect';

import { PassphraseFormModal } from './PassphraseFormModal';
import { isPassphraseModalVisibleAtom } from './isPassphraseModalVisibleAtom';

export const PassphraseModalRenderer = () => {
    const [isPassphraseModalVisible, setIsPassphraseModalVisible] = useAtom(
        isPassphraseModalVisibleAtom,
    );

    useEffect(() => {
        TrezorConnect.on(UI.REQUEST_PASSPHRASE, () => setIsPassphraseModalVisible(true));

        return () =>
            TrezorConnect.off(UI.REQUEST_PASSPHRASE, () => setIsPassphraseModalVisible(false));
    }, [setIsPassphraseModalVisible]);

    if (!isPassphraseModalVisible) return null;

    return <PassphraseFormModal />;
};
