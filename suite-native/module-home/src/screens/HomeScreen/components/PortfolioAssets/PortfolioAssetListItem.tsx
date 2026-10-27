import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAmount,
    selectWalletAssetContractAddress,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetFiatValue,
    selectWalletAssetSymbol,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { useFormatters } from '@suite-common/formatters';
import { type WalletAssetKey } from '@suite-common/wallet-core';
import { areBaseCurrencyAmountsEqual } from '@suite-common/wallet-types';
import { Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
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
import { TokenName } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const rowStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp20,
    paddingVertical: utils.spacings.sp12,
}));

type PortfolioAssetListItemProps = {
    assetKey: WalletAssetKey;
};

export const PortfolioAssetListItem = ({ assetKey }: PortfolioAssetListItemProps) => {
    const symbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetSymbol(state, assetKey),
    );
    const contractAddress = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetContractAddress(state, assetKey),
    );
    const displaySymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetDisplaySymbol(state, assetKey),
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );
    const amount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAmount(state, assetKey),
    );
    // Compared by value: one selector serves every row, so it can't keep each amount referentially stable.
    const fiatValue = useSelector(
        (state: HomeAssetTableState) => selectWalletAssetFiatValue(state, assetKey),
        areBaseCurrencyAmountsEqual,
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
            testID={`@home/portfolio-assets/asset/${symbol}/${contractAddress ?? 'coin'}`}
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
                    <Box flex={1}>
                        <TokenName
                            text={displaySymbol ?? ''}
                            networkSymbol={symbol}
                            tokenContract={contractAddress}
                            variant="body-sm"
                            numberOfLines={1}
                        />
                    </Box>
                    <BaseCurrencyAmountFormatter
                        value={fiatValue ?? null}
                        symbol={symbol}
                        variant="body-sm"
                    />
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
                            tokenSymbol={tokenSymbol}
                            networkSymbol={symbol}
                            tokenContract={contractAddress}
                            tokenDecimals={tokenDecimals}
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
