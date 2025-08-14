import { memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    TradingRootState,
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { BottomSheetModal, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { ExchangeApprovalLimitCard } from './ExchangeApprovalLimitCard';

type ExchangeApprovalLimitSheetProps = {
    isVisible: boolean;
    onDismiss: () => void;
};

export const ExchangeApprovalLimitSheet = memo(
    ({ isVisible, onDismiss }: ExchangeApprovalLimitSheetProps) => {
        const { bottomSheetRef, openModal } = useBottomSheetModal();

        useEffect(() => {
            if (isVisible) {
                openModal();
            }
        }, [isVisible, openModal]);

        const quote = useSelector(selectTradingExchangeSelectedQuote);
        const providerInfo = useSelector((state: TradingRootState) =>
            selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'exchange'),
        );

        const coinSymbol = useSelector((state: TradingRootState) =>
            selectTradingCoinSymbolByCryptoId(state, quote?.send),
        );

        if (!quote) {
            return null;
        }

        const { symbol, contractAddress } = quote.send
            ? cryptoIdToNetworkSymbolAndContractAddress(quote.send)
            : {};

        if (!symbol) {
            return null;
        }

        const limitAmount = `200.32 ${coinSymbol}`; //TODO

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
                        isChecked={true}
                        onChange={() => {
                            // TODO
                        }}
                    />

                    <ExchangeApprovalLimitCard
                        title={limitAmount}
                        description={
                            <Translation
                                id="moduleTrading.exchangeApprovalLimitSheet.limitedCard.description"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        symbol={symbol}
                        contractAddress={contractAddress}
                        isChecked={false}
                        onChange={() => {
                            // TODO
                        }}
                    />
                </VStack>
            </BottomSheetModal>
        );
    },
);
