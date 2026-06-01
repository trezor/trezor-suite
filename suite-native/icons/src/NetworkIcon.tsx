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
    type NetworkIconName,
    getNetworkIconName,
    isNetworkIconSymbol,
    isTestnetNetworkIconSymbol,
    networkIcons,
} from '@suite-common/icons';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type CSSColor } from '@trezor/theme';

import { type CryptoIconSize } from './CryptoIcon';

export interface NetworkIconProps {
    symbol: NetworkSymbol;
    size?: CryptoIconSize | number;
}

export const networkIconSizes = {
    tiny: 6,
    extraSmall: 9,
    small: 12,
    large: 18,
    extraLarge: 24,
} as const;

const iconStyle = prepareNativeStyle<{ width: number; height: number }>((_, { width, height }) => ({
    width,
    height,
}));

type NetworkIconCanvasProps = {
    iconName: NetworkIconName;
    size: number;
    backgroundColor: CSSColor;
    iconColor: CSSColor;
};

const NetworkIconCanvas = ({
    iconName,
    size,
    backgroundColor,
    iconColor,
}: NetworkIconCanvasProps) => {
    const iconSvg = useSVG(networkIcons[iconName]);

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

    const sizeNumber = typeof size === 'number' ? size : networkIconSizes[size];

    if (!isNetworkIconSymbol(symbol)) {
        return null;
    }

    const iconName = getNetworkIconName(symbol);
    const isTestnet = isTestnetNetworkIconSymbol(symbol);
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
                iconName={iconName}
                size={sizeNumber}
                backgroundColor={backgroundColor}
                iconColor={iconColor}
            />
        </View>
    );
};
