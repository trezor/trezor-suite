import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { DexApprovalType } from 'invity-api';

import { selectTradingExchangeSelectedQuote } from '@suite-common/trading';
import { useBottomSheetControls } from '@suite-native/atoms';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { LimitInfoRow } from './LimitInfoRow';

type LimitPickerProps = {
    onApprovalTypeChange: (approvalType: DexApprovalType) => void;
};

export const LimitPicker = ({ onApprovalTypeChange }: LimitPickerProps) => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();

    const handleApprovalTypeChange = useCallback(
        (newApprovalType: DexApprovalType) => {
            if (quote) {
                onApprovalTypeChange(newApprovalType);
            }
            hideSheet();
        },
        [hideSheet, onApprovalTypeChange, quote],
    );

    const approvalType = quote?.approvalType ?? 'MINIMAL';

    if (!quote?.send) {
        return null;
    }

    return (
        <>
            <LimitInfoRow onPress={showSheet} testID="ExchangeApproval/LimitPicker" withCaret />
            <ExchangeApprovalLimitSheet
                isVisible={isSheetVisible}
                onDismiss={hideSheet}
                onApprovalTypeSelect={handleApprovalTypeChange}
                selectedApprovalType={approvalType}
                quote={quote}
            />
        </>
    );
};
