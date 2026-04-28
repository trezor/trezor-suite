import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { DexApprovalType } from 'invity-api';

import { selectTradingExchangeActiveQuote } from '@suite-common/trading';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useBottomSheetControls } from '@suite-native/trading-atoms';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { LimitInfoRow } from './LimitInfoRow';
import { LimitPickerUnlimitedAlert } from './LimitPickerUnlimitedAlert';

type LimitPickerProps = {
    onApprovalTypeChange: (approvalType: DexApprovalType) => void;
};

export const LimitPicker = ({ onApprovalTypeChange }: LimitPickerProps) => {
    const quote = useSelector(selectTradingExchangeActiveQuote);
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

    const isInfinite = approvalType === 'INFINITE';

    return (
        <>
            <LimitInfoRow onPress={showSheet} testID="ExchangeApproval/LimitPicker" withCaret>
                <Text variant="body-sm" color="contentSecondary">
                    {isInfinite ? (
                        <Translation id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info" />
                    ) : (
                        <Translation id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.info" />
                    )}
                </Text>
                {isInfinite && <LimitPickerUnlimitedAlert cryptoId={quote.send} />}
            </LimitInfoRow>
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
