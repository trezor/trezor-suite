import { useEffect, useState } from 'react';

import TrezorConnect from '@trezor/connect';
import type { MethodInfo } from '@trezor/connect/src/core/AbstractMethod';

// Load AbstractMethod from @trezor/connect based on the URL parameters
export const useConnectMethod = (popupOptions?: { method: string; params: any }) => {
    const [method, setMethod] = useState<MethodInfo | undefined>();
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

        const run = async () => {
            try {
                // @ts-expect-error method is dynamic
                const methodInfo = await TrezorConnect[popupOptions.method]({
                    ...popupOptions.params,
                    __info: true,
                });
                if (
                    methodInfo.payload.requiredPermissions.includes('management') ||
                    methodInfo.payload.requiredPermissions.includes('push_tx')
                ) {
                    setMethodError('Method requires unsafe permissions');

                    return;
                }
                setMethod(methodInfo.payload);
            } catch (error) {
                console.error('Error while getting method', error);
                setMethod(undefined);
                setMethodError(error.message);
            }
        };
        run();
    }, [popupOptions?.method, popupOptions?.params]);

    return { method, methodError };
};
