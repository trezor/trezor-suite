import { useCallback, useEffect, useRef } from 'react';

import { events } from '@suite/analytics';
import { type TradingExchangeFormProps, exchangeThunks } from '@suite-common/trading';
import { type Network } from '@suite-common/wallet-config';

import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { mapTradingTimerToTimer } from './mapTradingTimerToTimer';
import { type TradingTimer } from './useTradingTimer';

type TradingExchangeUseHandleChangeProps = {
    formValues: TradingExchangeFormProps;
    network: Network;
    timer: TradingTimer;
    shouldSendInSats: boolean | undefined;

    composeRequestCallback: () => void;
    setApprovalInitiated?: (value: boolean) => void;
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
    timer,
    shouldSendInSats,
    composeRequestCallback,
    setApprovalInitiated,
    setIsScheduledQuotesRefresh,
}: TradingExchangeUseHandleChangeProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const previousPromise = useRef<PromiseType>(null);

    const handleChange = useCallback(async () => {
        if (previousPromise.current) {
            previousPromise.current.abort('Request was replaced by another one.');
        }

        setApprovalInitiated?.(false);

        const promise = dispatch(
            exchangeThunks.handleRequestThunk({
                formValues,
                network,
                timer: mapTradingTimerToTimer(timer),
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

        setIsScheduledQuotesRefresh?.(false);
    }, [
        setApprovalInitiated,
        dispatch,
        formValues,
        network,
        timer,
        shouldSendInSats,
        composeRequestCallback,
        setIsScheduledQuotesRefresh,
        analytics,
    ]);

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
