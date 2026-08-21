import { useDispatch } from 'react-redux';

import { notificationsActions } from '@suite-common/toast-notifications';
import { copyToClipboard } from '@trezor/dom-utils';

/**
 * Copies a single field of the Sign and Verify form. Every field is copied as it stands, so what
 * lands in the clipboard is always what the field shows — the Electrum-format signature included.
 */
export const useCopyValue = () => {
    const dispatch = useDispatch();

    return async (value: string) => {
        const result = await copyToClipboard(value);

        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };
};
