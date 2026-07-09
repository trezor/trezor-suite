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

import { type TokenLogoSize } from './TokenLogo';

interface NetworkLogoProps {
    networkSymbol: NetworkSymbol;
    size?: TokenLogoSize | number;
}

export const networkLogoSizes = {
    tiny: 6,
    little: 8,
    extraSmall: 9,
    small: 12,
    large: 18,
    extraLarge: 24,
} as const;

const logoStyle = prepareNativeStyle<{ width: number; height: number }>((_, { width, height }) => ({
    width,
    height,
}));

type NetworkLogoCanvasProps = {
    logoName: NetworkIconName;
    size: number;
    backgroundColor: CSSColor;
    logoColor: CSSColor;
};

const NetworkLogoCanvas = ({
    logoName,
    size,
    backgroundColor,
    logoColor,
}: NetworkLogoCanvasProps) => {
    const logoSvg = useSVG(networkIcons[logoName]);

    if (!logoSvg) {
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
                        <BlendColor color={logoColor} mode="srcIn" />
                    </Paint>
                }
            >
                <ImageSVG svg={logoSvg} x={0} y={0} width={size} height={size} />
            </Group>
        </Canvas>
    );
};

export const NetworkLogo = ({ networkSymbol, size = 'small' }: NetworkLogoProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { translate } = useTranslate();

    const sizeNumber = typeof size === 'number' ? size : networkLogoSizes[size];

    if (!isNetworkIconSymbol(networkSymbol)) {
        return null;
    }

    const logoName = getNetworkIconName(networkSymbol);
    const isTestnet = isTestnetNetworkIconSymbol(networkSymbol);

    const backgroundColor = isTestnet
        ? utils.colors.elementFillCriticalBold
        : utils.colors.elementFillContrast;

    const logoColor = isTestnet
        ? utils.colors.contentOnDarkPrimary
        : utils.colors.contentPrimaryInverse;

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityHint={translate('icons.networkIconHint')}
            style={applyStyle(logoStyle, { width: sizeNumber, height: sizeNumber })}
        >
            <NetworkLogoCanvas
                logoName={logoName}
                size={sizeNumber}
                backgroundColor={backgroundColor}
                logoColor={logoColor}
            />
        </View>
    );
};
