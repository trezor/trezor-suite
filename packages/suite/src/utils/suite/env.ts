import { desktopApi, SuiteThemeVariant } from '@trezor/suite-desktop-api';
import type { EnvironmentType } from '@suite-types';

export const isWeb = () => process.env.SUITE_TYPE === 'web';

export const isDesktop = () => process.env.SUITE_TYPE === 'desktop';

export const isMobile = () => process.env.SUITE_TYPE === 'mobile';

export const getEnvironment = (): EnvironmentType => {
    if (isWeb()) return 'web';
    if (isDesktop()) return 'desktop';
    if (isMobile()) return 'mobile';

    return '';
};

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
        window.open(formAction, isDesktop() ? '_blank' : formTarget);
        return;
    }

    if (isDesktop()) {
        let params = `a=${encodeURIComponent(formAction)}`;
        Object.keys(fields).forEach(k => {
            params += `&${k}=${encodeURIComponent(fields[k])}`;
        });
        const serverUrl = await desktopApi.getHttpReceiverAddress('/buy-post');
        window.open(`${serverUrl}?${params}`, '_blank');
    } else {
        const form = document.createElement('form');
        form.method = formMethod;
        form.action = formAction;
        Object.keys(fields).forEach(key => {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = fields[key];
            form.appendChild(hiddenField);
        });

        if (!document.body) return;
        document.body.appendChild(form);
        form.submit();
    }
};

const getDarkThemeQuery = (): MediaQueryList | undefined => {
    const matchMedia = window?.matchMedia;
    return matchMedia && matchMedia('(prefers-color-scheme: dark)');
};

export const getOsTheme = () => (getDarkThemeQuery()?.matches ? 'dark' : 'light');

export const watchOsTheme = (callback: (theme: Exclude<SuiteThemeVariant, 'system'>) => void) => {
    const onThemeChange = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light');
    const query = getDarkThemeQuery();
    query?.addEventListener('change', onThemeChange);
    return () => query?.removeEventListener('change', onThemeChange);
};
