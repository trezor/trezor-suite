import { useEffect, useState } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useBackendReconnection = (
    symbol: NetworkSymbol,
    identity?: string,
    resolveTime?: number,
) => {
    const [progress, setProgress] = useState(false);
    const [time, setTime] = useState<number>();

    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        if (!resolveTime) return;
        const interval = setInterval(() => {
            const secToResolve = Math.round((resolveTime - new Date().getTime()) / 1000);
            setTime(secToResolve);
        }, 500);

        return () => {
            clearInterval(interval);
        };
    }, [resolveTime]);

    const reconnect = async () => {
        setProgress(true);
        const r: any = await dispatch(reconnectBlockchainThunk({ symbol, identity }));
        if (!r.success) {
            setProgress(false);
        }
    };

    const isResolving = typeof time === 'number' && time <= 0;
    const countdownSeconds = !isResolving ? time : undefined;
    const isReconnecting = progress || isResolving;

    return { reconnect, isReconnecting, countdownSeconds };
};
