import { useMemo } from 'react';
import { Pressable } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { invariant } from '@suite-common/suite-utils';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { CryptoIcon, Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { hexToRgba } from '@trezor/utils';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';
import { useTradeableAssetDominantColor } from '../../hooks/useTradeableAssetDominantColor';
import { TradeableAsset } from '../../types';

export type TradeableAssetButtonProps = {
    asset: TradeableAsset;
    caret?: boolean;
    onPress: () => void;
    accessibilityLabel: string;
};

const GRADIENT_START = { x: 0, y: 0.5 } as const;
const GRADIENT_END = { x: 1, y: 0.5 } as const;

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    padding: spacings.sp8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacings.sp8,
}));

const gradientBackgroundStyle = prepareNativeStyle(({ colors, borders }) => ({
    borderRadius: borders.radii.round,
    borderWidth: borders.widths.small,
    borderColor: hexToRgba(colors.iconDefault, 0.06),
}));

export const TradeableAssetButton = ({
    asset: { symbol, contractAddress, cryptoId },
    caret,
    onPress,
    accessibilityLabel,
}: TradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();

    const networkSymbol = cryptoIdToSymbol(cryptoId);
    invariant(networkSymbol, `Network symbol not found for cryptoId: ${cryptoId}`);

    const dominantAssetColor = useTradeableAssetDominantColor(networkSymbol, contractAddress);
    const gradientColors = useMemo<[string, string]>(
        () => [hexToRgba(dominantAssetColor, 0.3), hexToRgba(dominantAssetColor, 0.01)],
        [dominantAssetColor],
    );

    return (
        <LinearGradient
            colors={gradientColors}
            style={applyStyle(gradientBackgroundStyle)}
            start={GRADIENT_START}
            end={GRADIENT_END}
        >
            <Pressable
                onPress={onPress}
                style={applyStyle(buttonStyle)}
                accessible
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
            >
                <CryptoIcon symbol={networkSymbol} contractAddress={contractAddress} size="small" />
                <NetworkSymbolExtendedFormatter symbol={symbol} variant="callout" />
                {caret && <Icon name="caretDown" color="textSubdued" size="medium" />}
            </Pressable>
        </LinearGradient>
    );
};
