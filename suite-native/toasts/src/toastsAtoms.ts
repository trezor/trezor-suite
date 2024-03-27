import { ReactNode } from 'react';

import { A } from '@mobily/ts-belt';
import { atom } from 'jotai';

import { IconName } from '@suite-common/icons';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export type Toast = {
    id: number;
    icon: IconName;
    variant: ToastVariant;
    message: ReactNode;
};

export type ToastWithoutId = Omit<Toast, 'id'>;

export const toastsAtom = atom<Toast[]>([]);

export const addToastAtom = atom(null, (get, set, addedToast: ToastWithoutId) => {
    const toasts = get(toastsAtom);

    if (A.all(toasts, ({ message }) => message !== addedToast.message)) {
        toasts.push({ ...addedToast, id: new Date().getTime() });
    }

    set(toastsAtom, [...toasts]);
});

export const removeToastAtom = atom(null, (get, set, removedToastId: number) => {
    const toasts = get(toastsAtom);
    set(toastsAtom, A.filter(toasts, toast => toast.id !== removedToastId) as Toast[]);
});
