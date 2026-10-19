import { useSelector } from 'react-redux';

import {
    type HomeAssetTableState,
    selectWalletAssetAmount,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import {
    selectBaseCurrency,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { asBaseCurrencyAmount, toTokenSymbol } from '@suite-common/wallet-types';
import { useAssetPrice } from '@suite-native/assets';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    BaseCurrencyAmountHeaderFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { useAssetDetailAsset } from '../hooks/useAssetDetailAsset';

type AssetDetailBalanceValuesProps = {
    assetDisplaySymbol: string;
};

export const AssetDetailBalanceValues = ({ assetDisplaySymbol }: AssetDetailBalanceValuesProps) => {
    const { assetKey, networkSymbol, tokenContract } = useAssetDetailAsset();

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const isAssetAmountInSats = useSelector((state: HomeAssetTableState) =>
        selectIsAmountInSats(state, networkSymbol),
    );
    const cryptoBalance = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAmount(state, assetKey),
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );

    const { price } = useAssetPrice({ networkSymbol, tokenContract });

    const fiatBalance =
        price === null || cryptoBalance === undefined
            ? null
            : asBaseCurrencyAmount(price.multipliedBy(cryptoBalance));

    if (networkSymbol === undefined || cryptoBalance === undefined) return null;

    return (
        <VStack spacing="sp16">
            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <Text variant="body-xs" color="contentSecondary">
                    {isBaseCurrencyInSats ? 'SAT' : baseCurrencyCode.toUpperCase()}
                </Text>
                <Box alignItems="flex-end" flexShrink={1}>
                    {fiatBalance === null ? (
                        <BaseCurrencyAmountFormatter
                            value={null}
                            symbol={networkSymbol}
                            variant="headline-md"
                        />
                    ) : (
                        <BaseCurrencyAmountHeaderFormatter value={fiatBalance} />
                    )}
                </Box>
            </HStack>
            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <Text variant="body-xs" color="contentSecondary">
                    <Translation id="moduleAssets.assetDetailScreen.balanceSection.asset" />
                </Text>
                <HStack alignItems="center" spacing="sp4" flexShrink={1}>
                    {tokenContract ? (
                        <ExactTokenAmountFormatter
                            value={asDecimalTokenAmount(cryptoBalance)}
                            tokenSymbol={tokenSymbol ? toTokenSymbol(tokenSymbol) : null}
                            maxDisplayedDecimals={tokenDecimals}
                            withSymbol={false}
                            variant="body-md-strong"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    ) : (
                        <ExactCryptoAmountFormatter
                            value={cryptoBalance}
                            symbol={networkSymbol}
                            withSymbol={false}
                            variant="body-md-strong"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    )}
                    <Text variant="body-md" color="contentSecondary" numberOfLines={1}>
                        {isAssetAmountInSats ? 'sat' : assetDisplaySymbol}
                    </Text>
                </HStack>
            </HStack>
        </VStack>
    );
};
