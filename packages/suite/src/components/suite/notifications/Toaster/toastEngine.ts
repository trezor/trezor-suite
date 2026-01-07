import { toast } from 'react-toastify';

import type { NotificationEntry } from '@suite-common/toast-notifications';

import { renderToast } from './renderToast';

const sanitize = (payload: NotificationEntry): NotificationEntry => {
    const next = { ...payload };

    if (typeof next.error === 'string' && next.error.includes('assetType:')) {
        next.error = '';
    }

    return next;
};

export const showToast = (payload: NotificationEntry) => {
    const entry = sanitize(payload);

    toast(renderToast(entry), {
        toastId: entry.id,
        autoClose: entry.autoClose ?? 5000,
    });
};

export const dismissToast = (id: number) => {
    toast.dismiss(id);
};
