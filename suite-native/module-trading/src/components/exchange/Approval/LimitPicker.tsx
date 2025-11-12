import { useState } from 'react';
import { useSelector } from 'react-redux';

import type { DexApprovalType, ExchangeProviderInfo, ExchangeTrade } from 'invity-api';

import {
    type TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow, useBottomSheetControls } from '@suite-native/trading-atoms';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';

export type LimitPickerProps = {
    quote: ExchangeTrade;
};

export const LimitPicker = ({ quote }: LimitPickerProps) => {
    const [selectedApprovalType, setSelectedApprovalType] = useState<DexApprovalType>('INFINITE');
    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote.exchange, 'exchange'),
    ) as ExchangeProviderInfo | undefined;

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote.send),
    );

    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(quote.send);

    const handleApprovalTypeChange = (newType: DexApprovalType) => {
        setSelectedApprovalType(newType);
        hideSheet();
    };

    // TODO 22293 those strings need update according to latest design
    const limitDescription =
        selectedApprovalType === 'INFINITE' ? (
            <Translation
                id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.description"
                values={{
                    companyName: providerInfo?.companyName,
                    symbol: coinSymbol,
                }}
            />
        ) : (
            <Translation
                id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.description"
                values={{ symbol: coinSymbol }}
            />
        );

    return (
        <>
            <TradeInfoRow onPress={showSheet} testID="ExchangeApproval/LimitPicker">
                <VStack>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text variant="hint">
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.limitLabel" />
                        </Text>
                        <HStack alignItems="center">
                            {!!network?.symbol && (
                                <CryptoIcon
                                    symbol={network.symbol}
                                    contractAddress={contractAddress}
                                    size="extraSmall"
                                />
                            )}
                            <Text variant="hint" color="textSubdued">
                                {selectedApprovalType === 'INFINITE' ? (
                                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                                ) : (
                                    `${quote.sendStringAmount} ${coinSymbol}`
                                )}
                            </Text>
                            <Icon name="caretDown" size="medium" />
                        </HStack>
                    </HStack>
                    <Text variant="hint" color="textSubdued">
                        {limitDescription}
                    </Text>
                </VStack>
            </TradeInfoRow>
            <ExchangeApprovalLimitSheet
                isVisible={isSheetVisible}
                onDismiss={hideSheet}
                onApprovalTypeSelect={handleApprovalTypeChange}
                selectedApprovalType={selectedApprovalType}
                quote={quote}
            />
        </>
    );
};
