import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { TradeInfoRow, TradingAsset } from '@suite-native/trading-atoms';
import { CryptoToFiatValueBadge } from '@suite-native/trading-quote-utils';
import { BigNumber } from '@trezor/utils';

import { type TradingHistoryDetailAsset } from '../../hooks/useTradingHistoryDetailInfo';

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
    const { BaseCurrencyAmountFormatter, CryptoAmountFormatter } = useFormatters();

    const displayedAccountLabel = asset.type === 'crypto' ? asset.accountLabel : undefined;
    const formattedAmount =
        asset.type === 'crypto'
            ? CryptoAmountFormatter.format(asset.amount, {
                  symbol: asset.symbol,
                  withSymbol: false,
                  isBalance: true,
                  maxDisplayedDecimals: 16,
                  isEllipsisAppended: false,
              })
            : BaseCurrencyAmountFormatter.format(
                  asBaseCurrencyAmount(new BigNumber(asset.amount)),
                  {
                      currency: asset.fiatCurrency,
                      style: 'decimal',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 16,
                  },
              );

    return (
        <TradeInfoRow noBorder={isFirst}>
            <VStack flex={1} spacing="sp8">
                <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                    <Text color="contentSecondary" variant="body-sm">
                        <Translation
                            id={
                                side === 'pay'
                                    ? 'moduleTrading.tradeHistory.detail.info.youPay'
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
                {asset.type === 'crypto' ? (
                    <TradingAsset
                        assetType="crypto"
                        contractAddress={asset.contractAddress}
                        name={asset.name}
                        networkDisplay="text"
                        networkSymbol={asset.networkSymbol}
                        primaryLabel="symbol"
                        primaryTextVariant="body-md"
                        symbol={asset.displaySymbol}
                        rightContent={
                            <VStack alignItems="flex-end" flexShrink={1} spacing={0}>
                                <Text variant="body-md-strong" numberOfLines={1}>
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
                ) : null}
                {asset.type === 'fiat' ? (
                    <TradingAsset
                        assetType="fiat"
                        fiatCurrency={asset.fiatCurrency}
                        name={asset.fiatCurrency.toUpperCase()}
                        primaryLabel="symbol"
                        primaryTextVariant="body-md"
                        symbol={asset.fiatCurrency.toUpperCase()}
                        rightContent={
                            <Text variant="body-md-strong" numberOfLines={1}>
                                {formattedAmount}
                            </Text>
                        }
                    />
                ) : null}
            </VStack>
        </TradeInfoRow>
    );
};
