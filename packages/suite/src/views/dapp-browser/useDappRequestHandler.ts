import { useEffect } from 'react';

import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch } from 'src/hooks/suite';

import { handleDappRequestThunk } from './dappBrowserThunks';

// Listens for `device`-lane requests relayed from the host, dispatches the
// signing thunk (which routes through the device, Invariant 0), and returns the
// result to the host so it can answer the dApp.
export const useDappRequestHandler = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const handle = async (request: {
            requestId: string;
            method: string;
            params?: unknown;
            address: string;
            chainId: number;
            origin: string;
            appName: string;
        }) => {
            const outcome = await dispatch(handleDappRequestThunk(request)).unwrap();

            desktopApi.dappBrowserDispatchResponse(
                'error' in outcome
                    ? { requestId: request.requestId, error: outcome.error }
                    : { requestId: request.requestId, result: outcome.result },
            );
        };

        desktopApi.on('dapp-browser/dispatch-request', handle);

        return () => desktopApi.removeAllListeners('dapp-browser/dispatch-request');
    }, [dispatch]);
};
