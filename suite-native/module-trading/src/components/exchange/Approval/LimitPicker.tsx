import { useSelector } from 'react-redux';

import type { ExchangeProviderInfo } from 'invity-api';

import {
    type TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangePreselectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow } from '@suite-native/trading-atoms';

import { ExchangeApprovalLimitSheet } from './ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { useApprovalTypeControls } from '../../../hooks/exchange/Approval/useApprovalTypeControls';
import { TradingCoinAmountFormatter } from '../../general/TradingCoinAmountFormatter';

export const LimitPicker = () => {
    const quote = useSelector(selectTradingExchangePreselectedQuote);

    const { approvalType, isSheetVisible, showSheet, hideSheet, handleApprovalTypeChange } =
        useApprovalTypeControls(quote);

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote?.exchange, 'exchange'),
    ) as ExchangeProviderInfo | undefined;

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    if (!quote?.send) {
        return null;
    }

    const { send, sendStringAmount } = quote;
    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(send);

    // TODO 22293 those strings need update according to latest design
    const limitDescription =
        approvalType === 'INFINITE' ? (
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
                        <Text variant="body-sm">
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
                            {approvalType === 'INFINITE' ? (
                                <Text variant="body-sm" color="textSubdued">
                                    <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                                </Text>
                            ) : (
                                <TradingCoinAmountFormatter
                                    amount={sendStringAmount}
                                    cryptoId={send}
                                    variant="body-sm"
                                    color="textSubdued"
                                />
                            )}

                            <Icon name="caretDown" size="medium" />
                        </HStack>
                    </HStack>
                    <Text variant="body-sm" color="textSubdued">
                        {limitDescription}
                    </Text>
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
