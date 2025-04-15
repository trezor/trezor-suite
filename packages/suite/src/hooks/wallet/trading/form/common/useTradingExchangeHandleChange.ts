import { useCallback, useEffect, useRef } from 'react';

import { TradingExchangeFormProps, exchangeThunks } from '@suite-common/trading';
import { Network } from '@suite-common/wallet-config';
import { Timer } from '@trezor/react-utils';

import { useDispatch } from 'src/hooks/suite';

type TradingExchangeUseHandleChangeProps = {
    formValues: TradingExchangeFormProps;
    network: Network;
    timer: Timer;
    shouldSendInSats: boolean | undefined;

    composeRequestCallback: () => void;
};

type PromiseType = {
    abort: (message?: string) => void;
} | null;

/**
 * Wrapping the handleRequestThunk to have a better control
 * over the request.
 */
export const useTradingExchangeHandleChange = ({
    formValues,
    network,
    timer,
    shouldSendInSats,
    composeRequestCallback,
}: TradingExchangeUseHandleChangeProps) => {
    const dispatch = useDispatch();
    const previousPromise = useRef<PromiseType>(null);

    const handleChange = useCallback(async () => {
        if (previousPromise.current) {
            previousPromise.current.abort('Request was replaced by another one.');
        }

        const promise = dispatch(
            exchangeThunks.handleRequestThunk({
                formValues,
                network,
                timer,
                shouldSendInSats,
                composeRequestCallback,
            }),
        );

        previousPromise.current = promise;

        try {
            await promise.unwrap();
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('Request was aborted:', error.message);
            }
        }
    }, [dispatch, formValues, network, timer, shouldSendInSats, composeRequestCallback]);

    // cleanup signal
    useEffect(
        () => () => {
            if (previousPromise.current) {
                previousPromise.current.abort('Request is canceled - page is unmounted.');
            }
        },
        [],
    );

    return { handleChange };
};
