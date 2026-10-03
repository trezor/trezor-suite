import { View } from 'react-native';

import {
    BlendColor,
    Canvas,
    Group,
    ImageSVG,
    Paint,
    RoundedRect,
    useSVG,
} from '@shopify/react-native-skia';

import {
    getNetworkIconName,
    isNetworkIconSymbol,
    isTestnetNetworkIconSymbol,
    networkIcons,
} from '@suite-common/icons';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type CSSColor } from '@trezor/theme';

import { useNetworkIcon } from './useNetworkIcon';

interface NetworkIconProps {
    symbol: NetworkSymbol;
    size?: NetworkIconSize | number;
}

export const networkIconSizes = {
    tiny: 6,
    extraSmall: 9,
    small: 12,
    medium: 15,
    large: 18,
    extraLarge: 24,
} as const;

export type NetworkIconSize = keyof typeof networkIconSizes;

const iconStyle = prepareNativeStyle<{ width: number; height: number }>((_, { width, height }) => ({
    width,
    height,
}));

type NetworkIconCanvasProps = {
    source: string | number;
    size: number;
    backgroundColor: CSSColor;
    iconColor: CSSColor;
};

const NetworkIconCanvas = ({
    source,
    size,
    backgroundColor,
    iconColor,
}: NetworkIconCanvasProps) => {
    const iconSvg = useSVG(source);

    if (!iconSvg) {
        return null;
    }

    return (
        <Canvas style={{ width: size, height: size }}>
            <RoundedRect
                x={0}
                y={0}
                width={size}
                height={size}
                r={size / 4}
                color={backgroundColor}
            />
            <Group
                layer={
                    <Paint>
                        <BlendColor color={iconColor} mode="srcIn" />
                    </Paint>
                }
            >
                <ImageSVG svg={iconSvg} x={0} y={0} width={size} height={size} />
            </Group>
        </Canvas>
    );
};

export const NetworkIcon = ({ symbol, size = 'small' }: NetworkIconProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();
    const network = useNetworkIcon(symbol);

    const sizeNumber = typeof size === 'number' ? size : networkIconSizes[size];

    if (!network && !isNetworkIconSymbol(symbol)) {
        return null;
    }

    const source = network
        ? network.icon.getIcons(network.symbol).network
        : isNetworkIconSymbol(symbol)
          ? networkIcons[getNetworkIconName(symbol)]
          : undefined;
    const isTestnet =
        network?.config.testnet ??
        (isNetworkIconSymbol(symbol) && isTestnetNetworkIconSymbol(symbol));

    if (source === undefined) return null;
    const backgroundColor = isTestnet
        ? utils.colors.elementFillCriticalBold
        : utils.colors.elementFillContrast;
    const iconColor = isTestnet
        ? utils.colors.contentOnDarkPrimary
        : utils.colors.contentPrimaryInverse;

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityHint={translate('icons.networkIconHint')}
            style={applyStyle(iconStyle, { width: sizeNumber, height: sizeNumber })}
        >
            <NetworkIconCanvas
                source={source}
                size={sizeNumber}
                backgroundColor={backgroundColor}
                iconColor={iconColor}
            />
        </View>
    );
};
