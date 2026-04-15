import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { DexApprovalType } from 'invity-api';

import {
    cryptoIdToNetworkAndContractAddress,
    selectTradingExchangeActiveQuote,
} from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { LimitPickerUnlimitedAlert } from './LimitPickerUnlimitedAlert';
import { hasPreapprovedLimit } from '../../../utils/exchange/quotesUtils';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

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

    const { send, approvalStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);
    const isInfinite = approvalType === 'INFINITE';

    return (
        <>
            <TradeInfoRow onPress={showSheet} testID="ExchangeApproval/LimitPicker">
                <VStack>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="body-sm">
                            {hasPreapprovedLimit(quote) ? (
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.newLimitLabel" />
                            ) : (
                                <Translation id="moduleTrading.tradingExchangeApprovalScreen.limitLabel" />
                            )}
                        </Text>
                        <HStack alignItems="center">
                            {!!network?.symbol && (
                                <CryptoIcon
                                    symbol={network.symbol}
                                    contractAddress={contractAddress}
                                    size="extraSmall"
                                />
                            )}
                            {isInfinite ? (
                                <Text variant="body-sm-strong">
                                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                                </Text>
                            ) : (
                                <TradingCoinAmountFormatter
                                    amount={approvalStringAmount ?? '0'}
                                    cryptoId={send}
                                    variant="body-sm-strong"
                                    color="contentPrimary"
                                />
                            )}
                            <Icon name="caretDown" size="medium" />
                        </HStack>
                    </HStack>
                    <Text variant="body-sm" color="contentSecondary">
                        {isInfinite ? (
                            <Translation id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.info" />
                        ) : (
                            <Translation id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.info" />
                        )}
                    </Text>
                    {isInfinite ? <LimitPickerUnlimitedAlert cryptoId={quote.send} /> : null}
                </VStack>
            </TradeInfoRow>
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
