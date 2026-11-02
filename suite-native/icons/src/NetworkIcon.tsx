import { View } from 'react-native';
import { useSelector } from 'react-redux';

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
    type NetworksRootState,
    injectGetNetworkIcon,
    injectHasNetworkIcon,
    selectNetworkConfig,
} from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { useTranslate } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import type { NetworkIconSource } from '@trezor/network-assets-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type CSSColor } from '@trezor/theme';

export const NETWORK_ICON_SIZES = [8, 12, 16, 20, 24, 32] as const;
export type NetworkIconSize = (typeof NETWORK_ICON_SIZES)[number];

type NetworkIconProps = {
    symbol: NetworkSymbol;
    size?: NetworkIconSize;
};

type NetworkIconCanvasProps = {
    source: NetworkIconSource;
    size: NetworkIconSize;
    backgroundColor: CSSColor;
    iconColor: CSSColor;
};

const iconStyle = prepareNativeStyle<{ size: NetworkIconSize }>((_, { size }) => ({
    width: size,
    height: size,
}));

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

export const NetworkIcon = ({ symbol, size = 16 }: NetworkIconProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();

    const { getNetworkIcon, hasNetworkIcon } = useServices(
        injectGetNetworkIcon,
        injectHasNetworkIcon,
    );
    const isTestnet = useSelector(
        (state: NetworksRootState) => selectNetworkConfig(state, symbol)?.testnet ?? false,
    );

    if (!hasNetworkIcon(symbol)) return null;
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
                source={getNetworkIcon(symbol)}
                size={size}
                backgroundColor={backgroundColor}
                iconColor={iconColor}
            />
        </View>
    );
};
