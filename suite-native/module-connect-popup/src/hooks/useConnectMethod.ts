import { useEffect, useState } from 'react';

import { getMethod } from '@trezor/connect/src/core/method';
import { AbstractMethod } from '@trezor/connect/src/core/AbstractMethod';
import { isDevelopOrDebugEnv } from '@suite-native/config';

// Load AbstractMethod from @trezor/connect based on the URL parameters
export const useConnectMethod = (popupOptions?: { method: string; params: any }) => {
    const [method, setMethod] = useState<AbstractMethod<any> | undefined>();
    const [methodError, setMethodError] = useState<string | undefined>();

    useEffect(() => {
        if (!popupOptions?.method) {
            console.error('No method specified');
            setMethod(undefined);
            setMethodError('No method specified');

            return;
        }

        setMethod(undefined);
        setMethodError(undefined);
        getMethod({
            id: 0,
            type: 'iframe-call',
            payload: {
                method: popupOptions?.method,
                ...popupOptions?.params,
            },
        })
            .then(async _method => {
                _method.init();
                await _method.initAsync?.();

                if (
                    _method.requiredPermissions.includes('management') ||
                    _method.requiredPermissions.includes('push_tx') ||
                    (!isDevelopOrDebugEnv() && _method.requiredPermissions.includes('write'))
                ) {
                    setMethodError('Method requires unsafe permissions');

                    return;
                }

                setMethod(_method);
            })
            .catch(e => {
                console.error('Error while getting method', e);
                setMethod(undefined);
                setMethodError(e.message);
            });
    }, [popupOptions?.method, popupOptions?.params]);

    return { method, methodError };
};
