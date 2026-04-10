import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { type NetworkDisplaySymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { Box, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { hexToRgba } from '@trezor/utils';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';
import { useTradeableAssetDominantColor } from '../../hooks/general/useTradeableAssetDominantColor';

export type TradeableAssetButtonProps = {
    asset: TradeableAsset;
    caret?: boolean;
    onPress: () => void;
    accessibilityLabel: string;
    testID?: string;
};

const GRADIENT_START = { x: 0, y: 0.5 } as const;
const GRADIENT_END = { x: 1, y: 0.5 } as const;

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    ...buttonSizeToDimensionsMap.medium,
    gap: spacings.sp8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
}));

const gradientBackgroundStyle = prepareNativeStyle<{ borderColor: ReturnType<typeof hexToRgba> }>(
    ({ borders }, { borderColor }) => ({
        borderRadius: buttonSizeToDimensionsMap.medium.borderRadius,
        borderWidth: borders.widths.small,
        borderColor,
    }),
);

export const TradeableAssetButton = ({
    asset: { symbol, contractAddress, cryptoId },
    caret,
    onPress,
    accessibilityLabel,
    testID,
}: TradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();

    const networkSymbol = cryptoIdToSymbol(cryptoId);
    invariant(networkSymbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    const dominantAssetColor = useTradeableAssetDominantColor(networkSymbol, contractAddress);
    const borderColor = useMemo(() => hexToRgba(dominantAssetColor, 0.16), [dominantAssetColor]);
    const gradientColors = useMemo<[string, string]>(
        () => [hexToRgba(dominantAssetColor, 0.3), hexToRgba(dominantAssetColor, 0.01)],
        [dominantAssetColor],
    );

    // when there is no contract address, we want to use display symbol instead
    // this way we can present ETH icon for EVMs instead of network icon
    const adjustedSymbol = contractAddress
        ? networkSymbol
        : (getDisplaySymbol(networkSymbol) as NetworkDisplaySymbol);

    const symbolTestID = testID ? `${testID}/symbol` : undefined;

    return (
        <LinearGradient
            colors={gradientColors}
            style={applyStyle(gradientBackgroundStyle, { borderColor })}
            start={GRADIENT_START}
            end={GRADIENT_END}
        >
            <Pressable
                onPress={onPress}
                style={applyStyle(buttonStyle)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                testID={testID}
            >
                <CryptoIcon symbol={adjustedSymbol} contractAddress={contractAddress} size="tiny" />
                <NetworkSymbolExtendedFormatter
                    symbol={symbol}
                    variant="body-sm-strong"
                    color="textDefault"
                    testID={symbolTestID}
                />
                {caret ? <Icon name="caretDown" color="textDefault" size="medium" /> : <Box />}
            </Pressable>
        </LinearGradient>
    );
};
