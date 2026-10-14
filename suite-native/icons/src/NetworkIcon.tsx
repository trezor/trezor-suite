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

export const NETWORK_ICON_SIZES = [8, 12, 16, 20, 24, 32] as const;
export type NetworkIconSize = (typeof NETWORK_ICON_SIZES)[number];

type NetworkIconProps = {
    symbol: NetworkSymbol;
    size?: NetworkIconSize;
};

type NetworkIconCanvasProps = {
    iconName: NetworkIconName;
    size: NetworkIconSize;
    backgroundColor: CSSColor;
    iconColor: CSSColor;
};

const iconStyle = prepareNativeStyle<{ size: NetworkIconSize }>((_, { size }) => ({
    width: size,
    height: size,
}));

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

export const NetworkIcon = ({ symbol, size = 16 }: NetworkIconProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();

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
            style={applyStyle(iconStyle, { size })}
        >
            <NetworkIconCanvas
                iconName={iconName}
                size={size}
                backgroundColor={backgroundColor}
                iconColor={iconColor}
            />
        </View>
    );
};
