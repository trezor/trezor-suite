import { useMemo } from 'react';

import { ParsedURL } from 'expo-linking';

import TrezorConnect from '@trezor/connect';

export const useConnectParseParams = (url: ParsedURL) => {
    const popupOptions = useMemo(() => {
        const { queryParams } = url;
        if (
            !queryParams?.method ||
            !queryParams?.params ||
            !queryParams?.callback ||
            typeof queryParams?.params !== 'string' ||
            typeof queryParams?.method !== 'string' ||
            typeof queryParams?.callback !== 'string' ||
            !TrezorConnect.hasOwnProperty(queryParams?.method)
        ) {
            return undefined;
        }
        const params = JSON.parse(queryParams.params);
        const { method: methodName, callback } = queryParams;

        return { method: methodName, params, callback };
    }, [url]);

    return popupOptions;
};
