import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectSendPrecomposedTx } from '@suite-common/wallet-core';
import { selectTradingProviderConfirmationStatus } from '@suite-native/trading-state';
import { type ProviderConfirmationStatus } from '@suite-native/trading-types';

import { useDispatchProviderConfirmationStatus } from './useDispatchProviderConfirmationStatus';

const FAIL_CONFIRMATION_TIMEOUT_MS = 30_000;

const STATUSES_TRIGGERING_TIMEOUT: ProviderConfirmationStatus[] = [
    'window_closed_with_success',
    'window_closed_incomplete',
];

export const useProviderConfirmationStatus = () => {
    const currentStatus = useSelector(selectTradingProviderConfirmationStatus);
    const precomposedTransaction = useSelector(selectSendPrecomposedTx);
    const isTradeConfirmed = precomposedTransaction?.type === 'final';

    const dispatchProviderConfirmationStatus = useDispatchProviderConfirmationStatus();

    useEffect(
        () => () => dispatchProviderConfirmationStatus('inactive'),
        [dispatchProviderConfirmationStatus],
    );

    useEffect(() => {
        if (isTradeConfirmed) {
            dispatchProviderConfirmationStatus('confirmation_success');
        }
    }, [isTradeConfirmed, dispatchProviderConfirmationStatus]);

    useEffect(() => {
        if (STATUSES_TRIGGERING_TIMEOUT.includes(currentStatus)) {
            const timeoutId = setTimeout(() => {
                dispatchProviderConfirmationStatus('confirmation_failed');
            }, FAIL_CONFIRMATION_TIMEOUT_MS);

            return () => {
                clearTimeout(timeoutId);
            };
        }

        return () => {};
    }, [currentStatus, dispatchProviderConfirmationStatus]);

    return currentStatus;
};
