import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAccountCount,
    selectWalletAssetAmount,
    selectWalletAssetFiatValue,
    selectWalletAssetKey,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { areBaseCurrencyAmountsEqual } from '@suite-common/wallet-types';
import { buildCurrencyShortOption } from '@suite-common/wallet-utils';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountHeaderFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';

export const AssetDetailBalanceSection = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const amount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAmount(state, assetKey),
    );
    const fiatValue = useSelector(
        (state: HomeAssetTableState) => selectWalletAssetFiatValue(state, assetKey),
        areBaseCurrencyAmountsEqual,
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );
    const accountCount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAccountCount(state, assetKey),
    );
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const baseCurrencyLabel = buildCurrencyShortOption({
        currency: baseCurrencyCode,
        areSatsDisplayed: isBaseCurrencyInSats,
    }).label;

    if (amount === undefined) {
        return null;
    }

    return (
        <VStack paddingHorizontal="sp20" paddingVertical="sp24" spacing="sp16">
            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <Text variant="body-xs" color="contentSecondary">
                    <Translation id="moduleAssets.assetDetailScreen.balanceSection.title" />
                </Text>
                <Text variant="body-xs" color="contentSecondary">
                    <Translation
                        id="moduleAssets.assetDetailScreen.balanceSection.accountCount"
                        values={{ count: accountCount }}
                    />
                </Text>
            </HStack>

            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <Text variant="body-xs" color="contentSecondary">
                    {baseCurrencyLabel}
                </Text>
                <Box alignItems="flex-end" flexShrink={1}>
                    <BaseCurrencyAmountHeaderFormatter value={fiatValue ?? null} />
                </Box>
            </HStack>

            <HStack alignItems="center" justifyContent="space-between" spacing="sp16">
                <Text variant="body-xs" color="contentSecondary">
                    <Translation id="moduleAssets.assetDetailScreen.balanceSection.asset" />
                </Text>
                <Box alignItems="flex-end" flexShrink={1}>
                    {tokenContract === undefined ? (
                        <ExactCryptoAmountFormatter
                            value={amount}
                            symbol={networkSymbol}
                            variant="body-md-strong"
                            color="contentPrimary"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    ) : (
                        <ExactTokenAmountFormatter
                            value={asDecimalTokenAmount(amount)}
                            tokenSymbol={tokenSymbol}
                            networkSymbol={networkSymbol}
                            tokenContract={tokenContract}
                            maxDisplayedDecimals={tokenDecimals}
                            variant="body-md-strong"
                            color="contentPrimary"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    )}
                </Box>
            </HStack>
        </VStack>
    );
};
