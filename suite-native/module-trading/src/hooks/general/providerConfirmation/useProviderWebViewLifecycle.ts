import { useCallback, useEffect } from 'react';

import { TradingType } from '@suite-common/trading';

import { useDispatchProviderConfirmationStatus } from './useDispatchProviderConfirmationStatus';

export const useProviderWebViewLifecycle = (tradingType: TradingType) => {
    const dispatchProviderConfirmationStatus = useDispatchProviderConfirmationStatus();

    useEffect(() => {
        if (tradingType === 'sell') {
            dispatchProviderConfirmationStatus('window_opened');

            return () => {
                dispatchProviderConfirmationStatus('window_closed_incomplete');
            };
        }

        return () => {};
    }, [dispatchProviderConfirmationStatus, tradingType]);

    const handleWebViewSuccess = useCallback(() => {
        if (tradingType === 'sell') {
            dispatchProviderConfirmationStatus('window_closed_with_success');
        }
    }, [dispatchProviderConfirmationStatus, tradingType]);

    return {
        handleWebViewSuccess,
    };
};
