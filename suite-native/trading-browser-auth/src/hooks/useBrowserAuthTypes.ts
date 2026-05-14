import type { FormResponse } from 'invity-api';

export type BrowserAuthRet = {
    openBrowser: (url: string, callbackUrl: string, orderId?: string) => Promise<void> | void;
    openBrowserForFormData: (
        formData: FormResponse['form'],
        returnUrl: string,
        orderId?: string,
    ) => void;
};
