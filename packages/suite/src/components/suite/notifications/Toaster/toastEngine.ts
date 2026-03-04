import { toast } from 'react-toastify/unstyled';

import { TranslationKey } from '@suite/intl';
import type { NotificationEntry } from '@suite-common/toast-notifications';

import { renderToast } from './renderToast';

const sanitize = (
    payload: NotificationEntry<TranslationKey>,
): NotificationEntry<TranslationKey> => {
    const next = { ...payload };

    if (typeof next.error === 'string' && next.error.includes('assetType:')) {
        next.error = '';
    }

    return next;
};

export const showToast = (payload: NotificationEntry<TranslationKey>) => {
    const entry = sanitize(payload);

    toast(renderToast(entry), {
        toastId: entry.id,
        autoClose: entry.autoClose ?? 5000,
        style: entry.style,
    });
};

export const dismissToast = (id: number) => {
    toast.dismiss(id);
};
