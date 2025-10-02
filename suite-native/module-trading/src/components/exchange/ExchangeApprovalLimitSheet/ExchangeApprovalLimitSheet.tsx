import { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { DexApprovalType, ExchangeTrade } from 'invity-api';

import {
    TradingRootState,
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import { TokenSymbol } from '@suite-common/wallet-types';
import { BottomSheetModal, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { CryptoAmountFormatter, TokenAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { ExchangeApprovalLimitCard } from './ExchangeApprovalLimitCard';

export type ExchangeApprovalLimitSheetProps = {
    isVisible: boolean;
    onDismiss: () => void;
    onApprovalTypeSelect: (type: DexApprovalType) => void;
    selectedApprovalType: DexApprovalType;
    quote: ExchangeTrade;
};

export const ExchangeApprovalLimitSheet = memo(
    ({
        isVisible,
        onDismiss,
        onApprovalTypeSelect,
        selectedApprovalType,
        quote,
    }: ExchangeApprovalLimitSheetProps) => {
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

        useEffect(
            () => (isVisible ? openModal() : closeModal()),
            [isVisible, openModal, closeModal],
        );

        const providerInfo = useSelector((state: TradingRootState) =>
            selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'exchange'),
        );

        const coinSymbol = useSelector((state: TradingRootState) =>
            selectTradingCoinSymbolByCryptoId(state, quote?.send),
        );

        const { symbol, contractAddress } = quote.send
            ? cryptoIdToNetworkSymbolAndContractAddress(quote.send)
            : {};

        if (!symbol) {
            return null;
        }

        const formattedLimitAmount =
            !!coinSymbol &&
            (isNetworkSymbol(coinSymbol) ? (
                <CryptoAmountFormatter
                    value={quote.sendStringAmount ?? '0'}
                    symbol={coinSymbol}
                    isBalance={false}
                    variant="callout"
                />
            ) : (
                <TokenAmountFormatter
                    value={quote.sendStringAmount ?? '0'}
                    tokenSymbol={coinSymbol as TokenSymbol}
                    variant="callout"
                />
            ));

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                onDismiss={onDismiss}
                title={<Translation id="moduleTrading.exchangeApprovalLimitSheet.title" />}
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingBottom="sp12">
                    <ExchangeApprovalLimitCard
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                        }
                        description={
                            <Translation
                                id="moduleTrading.exchangeApprovalLimitSheet.unlimitedCard.description"
                                values={{
                                    companyName: providerInfo?.companyName,
                                    symbol: coinSymbol,
                                }}
                            />
                        }
                        symbol={symbol}
                        contractAddress={contractAddress}
                        isChecked={selectedApprovalType === 'INFINITE'}
                        onChange={() => onApprovalTypeSelect('INFINITE')}
                    />

                    <ExchangeApprovalLimitCard
                        title={formattedLimitAmount}
                        description={
                            <Translation
                                id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.description"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        symbol={symbol}
                        contractAddress={contractAddress}
                        isChecked={selectedApprovalType === 'MINIMAL'}
                        onChange={() => onApprovalTypeSelect('MINIMAL')}
                    />
                </VStack>
            </BottomSheetModal>
        );
    },
);
