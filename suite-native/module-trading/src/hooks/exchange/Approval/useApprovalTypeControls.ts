import { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import type { DexApprovalType, ExchangeTrade } from 'invity-api';

import { tradingExchangeActions } from '@suite-common/trading';
import { useBottomSheetControls } from '@suite-native/trading-atoms';

export const useApprovalTypeControls = (quote: ExchangeTrade | undefined) => {
    const dispatch = useDispatch();
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();

    useEffect(() => {
        if (quote && !quote.approvalType) {
            dispatch(
                tradingExchangeActions.saveSelectedQuote({
                    ...quote,
                    approvalType: 'MINIMAL',
                }),
            );
        }
    }, [dispatch, quote]);

    const handleApprovalTypeChange = useCallback(
        (newApprovalType: DexApprovalType) => {
            if (quote) {
                dispatch(
                    tradingExchangeActions.saveSelectedQuote({
                        ...quote,
                        approvalType: newApprovalType,
                    }),
                );
            }
            hideSheet();
        },
        [dispatch, hideSheet, quote],
    );

    return {
        approvalType: quote?.approvalType ?? 'MINIMAL',
        isSheetVisible,
        showSheet,
        hideSheet,
        handleApprovalTypeChange,
    };
};
