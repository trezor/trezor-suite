import { notificationsActions } from '@suite-common/toast-notifications';
import { type Network } from '@suite-common/wallet-config';
import { copyToClipboard } from '@trezor/dom-utils';

import { useDispatch } from 'src/hooks/suite';

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

export const useCopySignedMessage = <T extends SignedMessageData>(
    { message, address, signature }: T,
    network?: Network,
) => {
    const dispatch = useDispatch();

    const canCopy = address && signature;

    const formatMessage = () => {
        if (network?.networkType === 'cardano') {
            return signature || '';
        }

        return format(
            { message, address, signature },
            (network?.name || '').split('(')[0]?.toUpperCase() ?? '',
        );
    };

    const copy = () => {
        const formatted = formatMessage();

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
