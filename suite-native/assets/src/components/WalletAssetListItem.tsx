import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetFiatValue,
    selectWalletAssetSymbol,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type WalletAssetKey, selectIsTokenFiatRateDisallowed } from '@suite-common/wallet-core';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { areBaseCurrencyAmountsEqual } from '@suite-common/wallet-types';
import { Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { AssetYieldRateBadge } from '@suite-native/earn';
import {
    BaseCurrencyAmountFormatter,
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import {
    AssetsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { TokenSymbol } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const rowStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
    paddingVertical: utils.spacings.sp12,
}));

type WalletAssetListItemProps = {
    assetKey: WalletAssetKey;
};

export const WalletAssetListItem = ({ assetKey }: WalletAssetListItemProps) => {
    const symbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSymbol(state, assetKey),
    );
    const contractAddress = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetContractAddress(state, assetKey),
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const amount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAmount(state, assetKey),
    );
    // Compared by value: one selector serves every row, so it can't keep each amount referentially stable.
    const fiatValue = useSelector(
        (state: HomeAssetTableState) => selectWalletAssetFiatValue(state, assetKey),
        areBaseCurrencyAmountsEqual,
    );

    const isFiatRateDisallowed = useSelector(
        (state: TokenDefinitionsRootState) =>
            symbol !== undefined && selectIsTokenFiatRateDisallowed(state, symbol, contractAddress),
    );

    const { applyStyle } = useNativeStyles();
    const { NetworkNameFormatter } = useFormatters();
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();

    if (symbol === undefined || amount === undefined) {
        return null;
    }

    const handlePress = () =>
        navigation.navigate(RootStackRoutes.AssetsStack, {
            screen: AssetsStackRoutes.AssetDetail,
            params: { networkSymbol: symbol, tokenContract: contractAddress },
        });

    return (
        <PressableOpacity
            onPress={handlePress}
            style={applyStyle(rowStyle)}
            testID={`@assets/wallet-asset/${symbol}/${contractAddress ?? 'coin'}`}
        >
            <TokenIcon
                networkSymbol={symbol}
                contractAddress={contractAddress}
                tokenSymbol={tokenSymbol ?? symbol}
                size="medium"
                showNetworkIcon
            />
            <VStack flex={1} spacing="sp4">
                <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                    <HStack flex={1} alignItems="center" spacing="sp8">
                        <Box flexShrink={1}>
                            <TokenSymbol isTruncated networkSymbol={symbol} tokenContract={contractAddress} variant="body-sm" numberOfLines={1} />
                        </Box>
                        <AssetYieldRateBadge
                            networkSymbol={symbol}
                            contractAddress={contractAddress}
                            tokenSymbol={tokenSymbol}
                            tokenDecimals={tokenDecimals}
                        />
                    </HStack>
                    {!isFiatRateDisallowed && (
                        <BaseCurrencyAmountFormatter
                            value={fiatValue ?? null}
                            symbol={symbol}
                            variant="body-sm"
                        />
                    )}
                </HStack>
                <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
                    <Box flex={1}>
                        <Text variant="body-xs" color="contentSecondary" numberOfLines={1}>
                            <NetworkNameFormatter value={symbol} />
                        </Text>
                    </Box>
                    {contractAddress ? (
                        <CompactTokenAmountFormatter
                            value={asDecimalTokenAmount(amount)}
                            networkSymbol={symbol}
                            contractAddress={contractAddress}
                            variant="body-xs"
                            color="contentTertiary"
                        />
                    ) : (
                        <CompactCryptoAmountFormatter
                            value={amount}
                            symbol={symbol}
                            variant="body-xs"
                            color="contentTertiary"
                        />
                    )}
                </HStack>
            </VStack>
        </PressableOpacity>
    );
};
