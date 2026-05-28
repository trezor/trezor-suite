import { useCallback, useEffect, useRef } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useServices } from '@suite-common/dependency-injection';
import {
    type TradingExchangeFormProps,
    exchangeThunks,
    tradingActions,
    useTradingRefetchScheduler,
} from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { noop } from '@trezor/utils';

import { useDispatch } from 'src/hooks/suite';

type TradingExchangeUseHandleChangeProps = {
    formValues: TradingExchangeFormProps;
    network: Network;
    shouldSendInSats: boolean | undefined;
    // receiveAddress and receiveAccountKey are read from useTradingReceiveAddress
    // directly rather than mirrored onto the outer form. Makes the receive identity
    // a single source of truth and closes the stale-address race exposed by #28143.
    receiveAddress?: string;
    receiveAccountKey?: AccountKey;

    composeRequestCallback: () => void;
    setIsScheduledQuotesRefresh?: (value: boolean) => void;
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
    shouldSendInSats,
    receiveAddress,
    receiveAccountKey,
    composeRequestCallback,
    setIsScheduledQuotesRefresh = noop,
}: TradingExchangeUseHandleChangeProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const previousPromise = useRef<PromiseType>(null);

    const handleChange = useCallback(async () => {
        if (previousPromise.current) {
            previousPromise.current.abort('Request was replaced by another one.');
        }

        const promise = dispatch(
            exchangeThunks.handleRequestThunk({
                formValues: {
                    ...formValues,
                    receiveAddress,
                    receiveAccountKey,
                },
                network,
                shouldSendInSats,
                composeRequestCallback,
            }),
        );

        previousPromise.current = promise;

        try {
            const quotes = await promise.unwrap();

            analytics.report({
                type: events.tradeReceivedQuotesEvent.name,
                payload: {
                    type: 'exchange',
                    count: quotes?.length ?? 0,
                },
            });
        } catch (error) {
            console.warn('Request was aborted:', error.message);
        }

        setIsScheduledQuotesRefresh(false);
    }, [
        dispatch,
        formValues,
        receiveAddress,
        receiveAccountKey,
        network,
        shouldSendInSats,
        composeRequestCallback,
        setIsScheduledQuotesRefresh,
        analytics,
    ]);

    const onBeforeRefetch = useCallback(() => {
        setIsScheduledQuotesRefresh(true);
    }, [setIsScheduledQuotesRefresh]);

    useTradingRefetchScheduler({ onRefetch: handleChange, onBeforeRefetch });

    // cleanup signal
    useEffect(
        () => () => {
            if (previousPromise.current) {
                previousPromise.current.abort('Request is canceled - page is unmounted.');
            }
            dispatch(tradingActions.stopRefetchQuotes());
        },
        [dispatch],
    );

    return { handleChange };
};
