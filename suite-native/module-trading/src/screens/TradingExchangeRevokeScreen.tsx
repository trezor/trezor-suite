import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import {
    TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingCoinSymbolByCryptoId,
    selectTradingExchangeSelectedQuote,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import { TokenSymbol } from '@suite-common/wallet-types';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Box, Button, Card, HStack, InlineAlertBox, Text, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { CryptoIcon, Icon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';
import { BigNumber } from '@trezor/utils';

import { TradeInfoHeader } from '../components/TradeInfo/TradeInfoHeader';
import { TradeInfoRow } from '../components/TradeInfo/TradeInfoRow';
import { ProviderLogo } from '../components/general/ProviderLogo';
import { selectExchangeSelectedSendAccount } from '../selectors/exchangeSelectors';

export const TradingExchangeRevokeScreen = () => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    invariant(quote, 'quote must be defined');

    const account = useSelector(selectExchangeSelectedSendAccount);

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
                <InlineAlertBox
                    title={<Translation id="moduleTrading.tradingExchangeRevokeScreen.infoAlert" />}
                    variant="warning"
                />

                <Card noPadding>
                    <TradeInfoHeader
                        title={<Translation id="moduleTrading.tradingExchangeRevokeScreen.from" />}
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
                            <Translation id="moduleTrading.tradingExchangeRevokeScreen.details" />
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
                    <TradeInfoRow>
                        <Text variant="hint">
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
                            <Text variant="hint" color="textSubdued">
                                <Translation id="moduleTrading.tradingExchangeRevokeScreen.unlimited" />
                            </Text>
                        </HStack>
                    </TradeInfoRow>
                    <TradeInfoRow>
                        <Text variant="hint">
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
                            {!!coinSymbol &&
                                (isNetworkSymbol(coinSymbol) ? (
                                    <CryptoAmountFormatter
                                        value={0}
                                        symbol={coinSymbol}
                                        isBalance={false}
                                        variant="hint"
                                        color="textSubdued"
                                    />
                                ) : (
                                    <TokenAmountFormatter
                                        value={0}
                                        tokenSymbol={coinSymbol as TokenSymbol}
                                        variant="hint"
                                        color="textSubdued"
                                    />
                                ))}
                        </HStack>
                    </TradeInfoRow>
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
                <Button
                    onPress={() => {
                        // TODO
                    }}
                >
                    <Translation id="generic.buttons.continue" />
                </Button>
            </Box>
        </Screen>
    );
};
