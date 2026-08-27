import { invariant } from '@suite-common/suite-utils';
import { type TradeableAssetBalance, cryptoIdToNetworkSymbol } from '@suite-common/trading';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { AnimatedPressable, Box, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { TradingAsset } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useTradingAssetPressStyle } from '../../../hooks/general/useTradingAssetPressStyle';

const containerStyle = prepareNativeStyle(({ borders }) => ({
    borderRadius: borders.radii.r12,
}));

export type TradeableAssetListItemProps = {
    asset: TradeableAsset;
    balance?: TradeableAssetBalance;
    onPress: () => void;
};

export const TradeableAssetListItem = ({
    asset,
    balance,
    onPress,
}: TradeableAssetListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { animatedStyle, handlePressIn, handlePressOut } = useTradingAssetPressStyle();
    const { symbol, name, contractAddress, cryptoId } = asset;

    const networkSymbol = cryptoIdToNetworkSymbol(cryptoId);
    invariant(networkSymbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    const balanceContent = balance ? (
        <VStack alignItems="flex-end" spacing={0}>
            <BaseCurrencyAmountFormatter
                value={balance.fiatAmount}
                variant="body-md"
                numberOfLines={1}
            />
            <CryptoAmountFormatter
                value={balance.cryptoAmount}
                symbol={contractAddress ? (symbol as TokenSymbol) : networkSymbol}
                variant="body-sm"
                color="contentSecondary"
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        </VStack>
    ) : undefined;

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessible
            accessibilityRole="button"
            accessibilityState={{ disabled: false }}
            accessibilityLabel={name}
            style={[animatedStyle, applyStyle(containerStyle)]}
        >
            <Box paddingHorizontal="sp8" paddingVertical="sp12">
                <TradingAsset
                    assetType="crypto"
                    name={name}
                    symbol={symbol}
                    contractAddress={contractAddress}
                    networkSymbol={networkSymbol}
                    rightContent={balanceContent}
                />
            </Box>
        </AnimatedPressable>
    );
};
