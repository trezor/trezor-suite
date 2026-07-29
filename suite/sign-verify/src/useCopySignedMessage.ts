import { useDispatch } from 'react-redux';

import { notificationsActions } from '@suite-common/toast-notifications';
import { type Network } from '@suite-common/wallet-config';
import { copyToClipboard } from '@trezor/dom-utils';

import type { SignVerifyNetworkConfig, SignedMessageData } from './types';

export const useCopySignedMessage = <T extends SignedMessageData>(
    { message, address, signature }: T,
    formatMessage: SignVerifyNetworkConfig['formatSignedMessage'],
    network?: Network,
) => {
    const dispatch = useDispatch();

    const canCopy = address && signature;

    const copy = () => {
        const formatted = formatMessage({ message, address, signature }, network);

        const result = copyToClipboard(formatted);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return {
        canCopy,
        copy,
    };
};
