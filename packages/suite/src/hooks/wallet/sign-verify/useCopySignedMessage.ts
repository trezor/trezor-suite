import { useActions } from '@suite-hooks';
import { copyToClipboard } from '@suite-utils/dom';
import { addToast } from '@suite-actions/notificationActions';

type SignedMessageData = {
    message: string;
    address: string;
    signature: string;
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

export const useCopySignedMessage = (
    { message, address, signature }: SignedMessageData,
    network?: string,
) => {
    const { addNotification } = useActions({ addNotification: addToast });
    const canCopy = address && signature;
    const copy = () => {
        const formatted = format(
            { message, address, signature },
            (network || '').split('(')[0].toUpperCase(),
        );
        const result = copyToClipboard(formatted, null);
        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
        }
    };

    return {
        canCopy,
        copy,
    };
};
