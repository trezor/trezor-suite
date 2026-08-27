import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AnimatedPressable, Box, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { TradingAsset } from '@suite-native/trading-atoms';
import { type MyAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useTradingAssetPressStyle } from '../../../hooks/general/useTradingAssetPressStyle';

const containerStyle = prepareNativeStyle<{ isDisabled: boolean }>(
    ({ borders }, { isDisabled }) => ({
        borderRadius: borders.radii.r12,
        opacity: isDisabled ? 0.5 : 1,
    }),
);

export type MyAssetListItemProps = {
    asset: MyAsset;
    onPress?: () => void;
};

export const MyAssetListItem = ({ asset, onPress }: MyAssetListItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { animatedStyle, handlePressIn, handlePressOut } = useTradingAssetPressStyle();
    const { symbol, name, balance, fiatBalance, tokenSymbol, contract, isEnabled } = asset;

    return (
        <AnimatedPressable
            onPress={isEnabled ? onPress : undefined}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isEnabled}
            accessible
            accessibilityRole="button"
            accessibilityState={{ disabled: !isEnabled }}
            accessibilityLabel={name}
            style={[animatedStyle, applyStyle(containerStyle, { isDisabled: !isEnabled })]}
        >
            <Box paddingHorizontal="sp8" paddingVertical="sp12">
                <TradingAsset
                    assetType="crypto"
                    name={name}
                    symbol={tokenSymbol ?? getNetworkDisplaySymbol(symbol)}
                    contractAddress={contract}
                    networkSymbol={symbol}
                    rightContent={
                        <VStack alignItems="flex-end" spacing={0}>
                            {fiatBalance !== null && (
                                <BaseCurrencyAmountFormatter
                                    value={fiatBalance}
                                    variant="body-md"
                                    numberOfLines={1}
                                />
                            )}
                            {tokenSymbol != null ? (
                                <TokenAmountFormatter
                                    value={balance}
                                    tokenSymbol={tokenSymbol}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    color="contentSecondary"
                                    variant="body-sm"
                                />
                            ) : (
                                <CryptoAmountFormatter
                                    value={balance}
                                    symbol={symbol}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    color="contentSecondary"
                                    variant="body-sm"
                                />
                            )}
                        </VStack>
                    }
                />
            </Box>
        </AnimatedPressable>
    );
};
