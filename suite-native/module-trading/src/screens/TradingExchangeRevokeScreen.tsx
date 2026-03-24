import Animated from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Box, Button, Card, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { CryptoIcon, Icon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DynamicScreenHeader,
    type RootStackParamList,
    Screen,
    type StackToStackCompositeNavigationProps,
    type StackToStackCompositeScreenProps,
    type TradingStackParamList,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { ProviderLogo, TradeInfoHeader, TradeInfoRow } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';
import { BigNumber } from '@trezor/utils';

import { TradingCoinAmountFormatter } from '../components/general/TradingCoinAmountFormatter';
import { TradingDeviceConnectionGuard } from '../components/general/TradingDeviceConnectionGuard';

type TradingExchangeRevokeScreenProps = StackToStackCompositeScreenProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeRevoke,
    RootStackParamList
>;

type NavigationProps = StackToStackCompositeNavigationProps<
    TradingStackParamList,
    TradingStackRoutes.TradingExchangeRevoke,
    RootStackParamList
>;

export const TradingExchangeRevokeScreen = ({
    route: { params },
}: TradingExchangeRevokeScreenProps) => {
    const { quote, shouldIncreaseLimit } = params;

    const navigation = useNavigation<NavigationProps>();

    const account = useSelector(selectExchangeSelectedSendAccount);

    const handleContinue = () => {
        // TODO
        if (shouldIncreaseLimit) {
            return navigation.replace(TradingStackRoutes.TradingExchangeApproval, {
                isRevoked: true,
            });
        }

        return navigation.goBack();
    };

    const { network, contractAddress } = quote.send
        ? cryptoIdToNetworkAndContractAddress(quote.send)
        : {};

    const providerInfo = useSelector((state: TradingRootState) =>
        selectTradingProviderByNameAndTradeType(state, quote.exchange, 'exchange'),
    );

    const coinSymbol = useSelector((state: TradingRootState) =>
        selectTradingCoinSymbolByCryptoId(state, quote?.send),
    );

    const fee = '4.76'; // TODO

    return (
        <TradingDeviceConnectionGuard>
            <Screen
                header={
                    <DynamicScreenHeader
                        title={
                            <Translation
                                id="moduleTrading.tradingExchangeRevokeScreen.title"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        subtitle={
                            <Translation
                                id="moduleTrading.tradingExchangeRevokeScreen.subtitle"
                                values={{ symbol: coinSymbol }}
                            />
                        }
                        closeActionType="back"
                    />
                }
            >
                <VStack spacing="sp16">
                    {!!shouldIncreaseLimit && (
                        <Animated.View>
                            <InlineAlertBox
                                title={
                                    <Translation id="moduleTrading.tradingExchangeRevokeScreen.infoAlert" />
                                }
                                variant="warning"
                            />
                        </Animated.View>
                    )}
                    <Card noPadding>
                        <TradeInfoHeader
                            title={
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.from" />
                            }
                            rightContent={
                                !!network?.symbol && (
                                    <HStack alignItems="center">
                                        <NetworkIcon symbol={network.symbol} size="extraLarge" />
                                        <Text variant="body-sm">{network.name}</Text>
                                    </HStack>
                                )
                            }
                        />
                        <TradeInfoRow>
                            <VStack spacing="sp4">
                                <Text variant="body-sm">
                                    <Translation id="moduleTrading.exchangeTradePreviewCard.account" />
                                </Text>
                                <Text variant="body-sm" color="textSubdued">
                                    {account?.accountLabel}
                                </Text>
                            </VStack>
                        </TradeInfoRow>
                    </Card>

                    <Card noPadding>
                        <TradeInfoHeader
                            title={
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.details" />
                            }
                        />
                        <TradeInfoRow>
                            <Text variant="body-sm">
                                <Translation id="moduleTrading.tradingScreen.provider" />
                            </Text>
                            <HStack alignItems="center">
                                {!!providerInfo?.logo && (
                                    <ProviderLogo logo={providerInfo.logo} size="body-sm" />
                                )}
                                <Text variant="body-sm" color="textSubdued">
                                    {providerInfo?.companyName}
                                </Text>
                            </HStack>
                        </TradeInfoRow>
                        <TradeInfoRow>
                            <Text variant="body-sm">
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.currentLimit" />
                            </Text>
                            <HStack alignItems="center">
                                {!!network?.symbol && (
                                    <CryptoIcon
                                        symbol={network.symbol}
                                        contractAddress={contractAddress}
                                        size="extraSmall"
                                    />
                                )}
                                <Text variant="body-sm" color="textSubdued">
                                    <TradingCoinAmountFormatter
                                        amount={quote.preapprovedStringAmount}
                                        cryptoId={quote.send}
                                        variant="body-sm"
                                        color="textSubdued"
                                    />
                                </Text>
                            </HStack>
                        </TradeInfoRow>
                        <TradeInfoRow>
                            <Text variant="body-sm">
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.newLimit" />
                            </Text>
                            <HStack alignItems="center">
                                {!!network?.symbol && (
                                    <CryptoIcon
                                        symbol={network.symbol}
                                        contractAddress={contractAddress}
                                        size="extraSmall"
                                    />
                                )}
                                <TradingCoinAmountFormatter
                                    amount="0"
                                    cryptoId={quote.send}
                                    variant="body-sm"
                                    color="textSubdued"
                                />
                            </HStack>
                        </TradeInfoRow>
                        <TradeInfoRow>
                            <Text variant="body-sm">
                                <Translation id="transactions.detail.feeLabel" />
                            </Text>
                            <HStack alignItems="center" spacing="sp8">
                                <Text variant="body-sm" color="textSubdued">
                                    ≈
                                </Text>
                                <BaseCurrencyAmountFormatter
                                    value={asBaseCurrencyAmount(new BigNumber(fee))}
                                    variant="body-sm"
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
            </Screen>
        </TradingDeviceConnectionGuard>
    );
};
