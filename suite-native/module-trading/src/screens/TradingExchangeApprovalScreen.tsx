import { useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import type { DexApprovalType } from 'invity-api';

import {
    TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Box, Button, Card, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, Icon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    RootStackParamList,
    Screen,
    StackNavigationProps,
    StackToStackCompositeScreenProps,
    TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { ProviderLogo, useBottomSheetControls } from '@suite-native/trading-atoms';
import { BigNumber } from '@trezor/utils';

import { TradeInfoHeader } from '../components/TradeInfo/TradeInfoHeader';
import { TradeInfoRow } from '../components/TradeInfo/TradeInfoRow';
import { ExchangeApprovalLimitSheet } from '../components/exchange/ExchangeApprovalLimitSheet/ExchangeApprovalLimitSheet';
import { useExchangeFlow } from '../hooks/exchange/useExchangeFlow';
import { selectExchangeSelectedSendAccount } from '../selectors/exchangeSelectors';

type TradingExchangeApprovalScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeApproval,
    RootStackParamList
>;

export const TradingExchangeApprovalScreen = ({
    route: { params },
}: TradingExchangeApprovalScreenProps) => {
    const { quote, shouldIncreaseLimit, isRevoked } = params;
    const navigation =
        useNavigation<
            StackNavigationProps<TradingStackParamList, TradingStackRoutes.TradingExchangeApproval>
        >();

    const account = useSelector(selectExchangeSelectedSendAccount);
    const [selectedApprovalType, setSelectedApprovalType] = useState<DexApprovalType>('INFINITE');

    const { network, contractAddress } = quote.send
        ? cryptoIdToNetworkAndContractAddress(quote.send)
        : {};

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote.exchange, 'exchange'),
    );

    const { isSheetVisible, showSheet, hideSheet } = useBottomSheetControls();

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const { confirmTrade } = useExchangeFlow();

    const fee = '4.76'; // TODO

    const handleContinue = async () => {
        const updatedQuote = {
            ...quote,
            approvalType: selectedApprovalType,
        };

        const success = await confirmTrade({
            receiveAddress: quote.receiveAddress ?? '',
            trade: updatedQuote,
            approvalFlow: true,
            nextStep: () => {},
        });

        if (success) {
            // TODO
            navigation.navigate(TradingStackRoutes.TradingExchangePreview, { isApproved: true });
        }
    };

    const handleApprovalTypeChange = (newType: DexApprovalType) => {
        setSelectedApprovalType(newType);
        hideSheet();
    };

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
                            values={{ symbol: coinSymbol, companyName: providerInfo?.companyName }}
                        />
                    }
                    closeActionType="back"
                />
            }
        >
            <VStack spacing="sp16">
                {!!shouldIncreaseLimit && (
                    <InlineAlertBox
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.lowLimitInfoAlert" />
                        }
                        variant="warning"
                    />
                )}

                {!!isRevoked && (
                    <InlineAlertBox
                        variant="success"
                        title={
                            <Translation id="moduleTrading.tradingExchangeApprovalScreen.revokeSuccessAlert" />
                        }
                    />
                )}

                <Card noPadding>
                    <TradeInfoHeader
                        title={<Translation id="moduleTrading.tradingExchangeApprovalScreen.for" />}
                        rightContent={
                            !!network?.symbol && (
                                <HStack alignItems="center">
                                    <NetworkIcon symbol={network.symbol} size="extraLarge" />
                                    <Text variant="hint">{network.name}</Text>
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
                            {!!providerInfo?.logo && (
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
                            <BaseCurrencyAmountFormatter
                                value={asBaseCurrencyAmount(new BigNumber(fee))}
                                variant="hint"
                                color="textSubdued"
                            />
                            <Icon name="caretDown" size="medium" />
                        </HStack>
                    </TradeInfoRow>
                </Card>
            </VStack>

            <Box paddingTop="sp20">
                <Button onPress={handleContinue}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
            <ExchangeApprovalLimitSheet
                isVisible={isSheetVisible}
                onDismiss={hideSheet}
                onApprovalTypeSelect={handleApprovalTypeChange}
                selectedApprovalType={selectedApprovalType}
                quote={quote}
            />
        </Screen>
    );
};
