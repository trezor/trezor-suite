import { isDesktop } from '@trezor/env-utils';
import { type SuiteThemeVariant, desktopApi } from '@trezor/suite-desktop-api';

export const submitRequestForm = async (
    formMethod: 'GET' | 'POST' | 'IFRAME',
    formAction: string,
    formTarget: '_blank' | '_self',
    fields: {
        [key: string]: string;
    },
) => {
    // for IFRAME there is nothing to submit
    if (formMethod === 'IFRAME') return;

    if (formMethod === 'GET' && formAction) {
        setTimeout(() => {
            // slightly delay opening of the new page, Suite Web may not complete storing data do DB otherwise
            window.open(formAction, isDesktop() ? '_blank' : formTarget);
        }, 100);

        return;
    }

    if (isDesktop()) {
        const address = await desktopApi.getHttpReceiverAddress('/buy-post');
        if (!address) return;

        const search = new URLSearchParams();
        if (address.token) search.set('token', address.token);
        search.set('a', formAction);
        Object.entries(fields).forEach(([k, v]) => search.set(k, v));
        window.open(`${address.url}?${search.toString()}`, '_blank');
    } else {
        const form = document.createElement('form');
        form.method = formMethod;
        form.action = formAction;
        Object.entries(fields).forEach(([key, value]) => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = value;
            form.appendChild(hiddenField);
        });

        if (!document.body) return;
        document.body.appendChild(form);
        form.submit();
    }
};

const getDarkThemeQuery = (): MediaQueryList | undefined => {
    const matchMedia = window?.matchMedia;

    return matchMedia?.('(prefers-color-scheme: dark)');
};

export const getOsTheme = () => (getDarkThemeQuery()?.matches ? 'dark' : 'light');

export const watchOsTheme = (callback: (theme: Exclude<SuiteThemeVariant, 'system'>) => void) => {
    const onThemeChange = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light');
    const query = getDarkThemeQuery();
    query?.addEventListener('change', onThemeChange);

    return () => query?.removeEventListener('change', onThemeChange);
};
