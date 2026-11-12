import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNativeTokenName } from '@suite-common/networks';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { AnimatedPressable, Box, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
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

    const nativeTokenName = useSelector((state: NetworksRootState) =>
        selectNativeTokenName(state, symbol),
    );
    const assetName = contract ? name : (nativeTokenName ?? name);

    const hasFiatBalance = fiatBalance !== null;

    const cryptoBalanceValue = contract ? (
        <CompactTokenAmountFormatter
            networkSymbol={symbol}
            contractAddress={contract}
            value={asDecimalTokenAmount(balance)}
            numberOfLines={1}
            adjustsFontSizeToFit
            color="contentSecondary"
            variant="body-sm"
        />
    ) : (
        <CompactCryptoAmountFormatter
            value={balance}
            symbol={symbol}
            numberOfLines={1}
            adjustsFontSizeToFit
            color="contentSecondary"
            variant="body-sm"
        />
    );

    return (
        <AnimatedPressable
            onPress={isEnabled ? onPress : undefined}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!isEnabled}
            accessible
            accessibilityRole="button"
            accessibilityState={{ disabled: !isEnabled }}
            accessibilityLabel={assetName}
            style={[animatedStyle, applyStyle(containerStyle, { isDisabled: !isEnabled })]}
        >
            <Box paddingHorizontal="sp8" paddingVertical="sp12">
                <TradingAsset
                    assetType="crypto"
                    name={assetName}
                    symbol={tokenSymbol ?? getNetworkDisplaySymbol(symbol)}
                    contractAddress={contract}
                    networkSymbol={symbol}
                    rightContent={
                        <VStack alignItems="flex-end" spacing={0}>
                            {hasFiatBalance && (
                                <BaseCurrencyAmountFormatter
                                    value={fiatBalance}
                                    variant="body-md"
                                    numberOfLines={1}
                                />
                            )}
                            {cryptoBalanceValue}
                        </VStack>
                    }
                />
            </Box>
        </AnimatedPressable>
    );
};
