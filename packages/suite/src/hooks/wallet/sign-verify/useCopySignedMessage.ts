import { copyToClipboard } from '@trezor/dom-utils';
import { useActions } from 'src/hooks/suite';
import { notificationsActions } from '@suite-common/toast-notifications';

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

export const useCopySignedMessage = <T extends SignedMessageData>(
    { message, address, signature }: T,
    network?: string,
) => {
    const { addNotification } = useActions({ addNotification: notificationsActions.addToast });

    const canCopy = address && signature;

    const copy = () => {
        const formatted = format(
            { message, address, signature },
            (network || '').split('(')[0].toUpperCase(),
        );

        const result = copyToClipboard(formatted);

        if (typeof result !== 'string') {
            addNotification({ type: 'copy-to-clipboard' });
        }
    };

    return {
        canCopy,
        copy,
    };
};
