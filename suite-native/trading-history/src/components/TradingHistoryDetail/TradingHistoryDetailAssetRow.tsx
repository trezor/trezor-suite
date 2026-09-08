import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow, TradingAsset } from '@suite-native/trading-atoms';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { type TradingHistoryDetailAsset } from '../../hooks/useTradingHistoryDetailInfo';

type TradingHistoryDetailAssetContentProps = {
    asset: TradingHistoryDetailAsset;
    testID: string;
};

const TradingHistoryDetailAssetContent = ({
    asset,
    testID,
}: TradingHistoryDetailAssetContentProps) => {
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();

    switch (asset.type) {
        case 'crypto': {
            const formattedAmount = CryptoAmountFormatter.format(asset.amount, {
                symbol: asset.symbol,
                withSymbol: false,
                isBalance: true,
                maxDisplayedDecimals: 16,
                isEllipsisAppended: false,
            });

            return (
                <TradingAsset
                    assetType="crypto"
                    contractAddress={asset.contractAddress}
                    name={asset.name}
                    networkDisplay="text"
                    networkSymbol={asset.networkSymbol}
                    primaryLabel="symbol"
                    primaryTextVariant="body-md"
                    symbol={asset.displaySymbol}
                    testID={testID}
                    rightContent={
                        <VStack alignItems="flex-end" flexShrink={1} spacing={0}>
                            <Text
                                variant="body-md-strong"
                                numberOfLines={1}
                                testID={`${testID}/amount`}
                            >
                                {formattedAmount}
                            </Text>
                            <HStack alignItems="center" spacing="sp2">
                                <Text variant="body-sm" color="contentSecondary">
                                    ≈
                                </Text>
                                <CryptoToFiatValueBadge
                                    variant="body-sm"
                                    amount={asset.amount}
                                    cryptoId={asset.cryptoId}
                                    color="contentSecondary"
                                />
                            </HStack>
                        </VStack>
                    }
                />
            );
        }
        case 'fiat': {
            const formattedAmount = BaseCurrencyAmountFormatter.format(
                asBaseCurrencyAmount(new BigNumber(asset.amount)),
                {
                    currency: asset.fiatCurrency,
                    style: 'decimal',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 16,
                },
            );

            return (
                <TradingAsset
                    assetType="fiat"
                    fiatCurrency={asset.fiatCurrency}
                    name={asset.fiatCurrency.toUpperCase()}
                    primaryLabel="symbol"
                    primaryTextVariant="body-md"
                    symbol={asset.fiatCurrency.toUpperCase()}
                    testID={testID}
                    rightContent={
                        <Text
                            variant="body-md-strong"
                            numberOfLines={1}
                            testID={`${testID}/amount`}
                        >
                            {formattedAmount}
                        </Text>
                    }
                />
            );
        }
        default:
            return exhaustive(asset);
    }
};

type TradingHistoryDetailAssetRowProps = {
    asset: TradingHistoryDetailAsset;
    isFirst?: boolean;
    side: 'pay' | 'get';
};

export const TradingHistoryDetailAssetRow = ({
    asset,
    isFirst,
    side,
}: TradingHistoryDetailAssetRowProps) => {
    const displayedAccountLabel = asset.type === 'crypto' ? asset.accountLabel : undefined;
    const testID = `@trading/history/detail/info/${side}`;

    return (
        <TradeInfoRow noBorder={isFirst} testID={testID}>
            <VStack flex={1} spacing="sp8">
                <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                    <Text color="contentSecondary" variant="body-sm">
                        <Translation
                            id={
                                side === 'pay'
                                    ? 'moduleTrading.tradeHistory.detail.info.youPayLabel'
                                    : 'moduleTrading.tradeHistory.detail.info.youGet'
                            }
                        />
                    </Text>
                    {!!displayedAccountLabel && (
                        <Text
                            color="contentSecondary"
                            variant="body-sm"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            testID={`${testID}/account-label`}
                        >
                            <Translation
                                id={
                                    side === 'pay'
                                        ? 'moduleTrading.tradeHistory.detail.info.fromAccount'
                                        : 'moduleTrading.tradeHistory.detail.info.toAccount'
                                }
                                values={{ accountLabel: displayedAccountLabel }}
                            />
                        </Text>
                    )}
                </HStack>
                <TradingHistoryDetailAssetContent asset={asset} testID={`${testID}/asset`} />
            </VStack>
        </TradeInfoRow>
    );
};
