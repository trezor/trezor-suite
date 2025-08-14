import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState,
    cryptoIdToNetworkSymbolAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { Box, Button, Card, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, Icon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { TradeInfoHeader } from '../components/TradeInfo/TradeInfoHeader';
import { TradeInfoRow } from '../components/TradeInfo/TradeInfoRow';
import { ExchangeApprovalLimitSheet } from '../components/exchange/ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { ProviderLogo } from '../components/general/ProviderLogo';
import { useBottomSheetControls } from '../hooks/general/useBottomSheetControls';
import { selectExchangeSelectedSendAccount } from '../selectors/exchangeSelectors';

export const TradingExchangeApprovalScreen = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    invariant(quote, 'quote must be defined');

    const account = useSelector(selectExchangeSelectedSendAccount);

    const networkSymbol = account?.symbol;

    const fromNetworkName = networkSymbol && getNetwork(networkSymbol)?.name;

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote.exchange, 'exchange'),
    );

    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const { symbol, contractAddress } = quote.send
        ? cryptoIdToNetworkSymbolAndContractAddress(quote.send)
        : {};

    const fee = '$4.76'; // TODO

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.title"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    subtitle={
                        <Translation
                            id="moduleTrading.tradingExchangeApprovalScreen.subtitle"
                            values={{ symbol: coinSymbol }}
                        />
                    }
                    closeActionType="close"
                />
            }
        >
            <VStack spacing="sp16">
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert" />
                    }
                    variant="success"
                />
                <InlineAlertBox
                    title={
                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.lowLimitInfoAlert" />
                    }
                    variant="info"
                />

                <Card noPadding>
                    <TradeInfoHeader
                        title={<Translation id="moduleTrading.tradingExchangeApprovalScreen.for" />}
                        rightContent={
                            !!networkSymbol && (
                                <HStack alignItems="center">
                                    <NetworkIcon symbol={networkSymbol} size="extraLarge" />
                                    <Text variant="hint">{fromNetworkName}</Text>
                                </HStack>
                            )
                        }
                    />
                    <TradeInfoRow>
                        <VStack spacing="sp4">
                            <Text variant="hint">
                                <Translation id="moduleTrading.exchangeTradePreviewCard.account" />
                            </Text>
                            <Text variant="hint" color="textSubdued">
                                {account?.accountLabel}
                            </Text>
                        </VStack>
                    </TradeInfoRow>
                </Card>

                <Card noPadding>
                    <TradeInfoHeader
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.approvalDetailsTitle" />
                        }
                    />
                    <TradeInfoRow>
                        <Text variant="hint">
                            <Translation id="moduleTrading.tradingScreen.provider" />
                        </Text>
                        <HStack alignItems="center">
                            {providerInfo?.logo && (
                                <ProviderLogo logo={providerInfo.logo} size="hint" />
                            )}
                            <Text variant="hint" color="textSubdued">
                                {providerInfo?.companyName}
                            </Text>
                        </HStack>
                    </TradeInfoRow>
                    <Pressable onPress={showSheet}>
                        <TradeInfoRow>
                            <VStack>
                                <HStack justifyContent="space-between" alignItems="center">
                                    <Text variant="hint">
                                        <Translation id="moduleTrading.tradingExchangeApprovalScreen.limitLabel" />
                                    </Text>
                                    <HStack alignItems="center">
                                        {!!symbol && (
                                            <CryptoIcon
                                                symbol={symbol}
                                                contractAddress={contractAddress}
                                                size="extraSmall"
                                            />
                                        )}
                                        <Text variant="hint" color="textSubdued">
                                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.unlimitedLabel" />
                                        </Text>
                                        <Icon name="caretDown" size="medium" />
                                    </HStack>
                                </HStack>
                                <Text variant="hint" color="textSubdued">
                                    <Translation
                                        id="moduleTrading.tradingExchangeApprovalScreen.limitInfo"
                                        values={{
                                            companyName: providerInfo?.companyName,
                                            symbol: coinSymbol,
                                        }}
                                    />
                                </Text>
                            </VStack>
                        </TradeInfoRow>
                    </Pressable>
                    <TradeInfoRow>
                        <Text variant="hint">
                            <Translation id="transactions.detail.feeLabel" />
                        </Text>
                        <HStack alignItems="center" spacing="sp8">
                            <Text variant="hint" color="textSubdued">
                                ≈
                            </Text>
                            <Text variant="hint" color="textSubdued">
                                {fee}
                            </Text>
                            <Icon name="caretDown" size="medium" />
                        </HStack>
                    </TradeInfoRow>
                </Card>
            </VStack>

            <Box paddingTop="sp20">
                <Button
                    onPress={() => {
                        // TODO
                    }}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
            <ExchangeApprovalLimitSheet isVisible={isSheetVisible} onDismiss={hideSheet} />
        </Screen>
    );
};
