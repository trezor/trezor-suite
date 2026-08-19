import { useDispatch } from 'react-redux';

import { notificationsActions } from '@suite-common/toast-notifications';
import { type Network } from '@suite-common/wallet-config';
import { copyToClipboard } from '@trezor/dom-utils';

type SignedMessageData = {
    message?: string;
    address?: string;

    /* Due to wrong abstraction in `useSignVerifyForm` this needs to be optional.
    If we ever separate Sign and Verify forms this shall be set to required.
    EDIT: All fields are optional when using watch() since react-hook-form 7.50.0 */
    signature?: string;
};

const format = (
    { message, address, signature }: SignedMessageData,
    network?: string,
) => `-----BEGIN ${network} SIGNED MESSAGE-----
${message}
-----BEGIN SIGNATURE-----
${address}
${signature}
-----END ${network} SIGNED MESSAGE-----`;

export const getSignedMessage = (data: SignedMessageData, network?: Network): string | null => {
    // Cardano hands over the signature alone and has no message block, hence null rather than a
    // block that would repeat the signature.
    if (network?.networkType === 'cardano') {
        return null;
    }

    return format(data, (network?.name || '').split('(')[0]?.toUpperCase() ?? '');
};

export const useCopySignedMessage = <T extends SignedMessageData>(
    { message, address, signature }: T,
    network?: Network,
) => {
    const dispatch = useDispatch();

    const canCopy = address && signature;
    const signedMessage = getSignedMessage({ message, address, signature }, network);

    const copyValue = async (value: string) => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    return {
        canCopy,
        signedMessage,
        copyValue,
        copySignature: () => copyValue(signature || ''),
        copySignedMessage: () => copyValue(signedMessage || signature || ''),
    };
};
