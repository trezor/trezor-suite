import { Dimensions, View } from 'react-native';
import QRCodeSkia from 'react-native-qrcode-skia';
import { useMemo } from 'react';

import { RadialGradient } from '@shopify/react-native-skia';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { colorVariants } from '@trezor/theme';
import { CryptoIcon } from '@suite-common/icons-deprecated';
import { NetworkSymbol } from '@suite-common/wallet-config';

const networkColors: Record<NetworkSymbol, `#${string}`> = {
    btc: '#f69c3d',
    eth: '#497493',
    etc: '#669073',
    vtc: '#205b30',
    dash: '#1376b5',
    zec: '#d38f36',
    btg: '#e8a629',
    ltc: '#949494',
    xrp: '#1b95ca',
    bch: '#0AC18E',
    dgb: '#0066cc',
    doge: '#cfb66c',
    nmc: '#186c9d',
    ada: '#3cc8c8',
    sol: '#dc1fff',
    matic: '#8247e5',
    bnb: '#f0b90b',
    test: '#f69c3d',
    regtest: '#f69c3d',
    tsep: '#497493',
    thol: '#497493',
    txrp: '#1b95ca',
    tada: '#3cc8c8',
    dsol: '#dc1fff',
};

type QRCodeProps = {
    data: string;
    network?: NetworkSymbol;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;

const MAX_QRCODE_SIZE = 250;
const QRCODE_PADDING = 24;

const QRCODE_SIZE =
    SCREEN_WIDTH < MAX_QRCODE_SIZE + QRCODE_PADDING ? SCREEN_WIDTH : MAX_QRCODE_SIZE;

const qrCodeContainerStyle = prepareNativeStyle(_ => ({
    width: QRCODE_SIZE + QRCODE_PADDING,
    height: QRCODE_SIZE + QRCODE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorVariants.standard.backgroundSurfaceElevation1,
}));

const shapeOptions = {
    shape: 'circle',
    eyePatternShape: 'rounded',
    eyePatternGap: 0,
    gap: 0,
} as const;

export const QRCode = ({ data, network }: QRCodeProps) => {
    const { applyStyle } = useNativeStyles();

    const networkColor = network ? networkColors[network] : null;

    const logoProps = useMemo(() => {
        if (!network) return null;

        return {
            logoAreaSize: 42 + 16,
            logo: <CryptoIcon symbol={network} size="large" />,
        };
    }, [network]);

    return (
        <Box alignItems="center">
            <View style={applyStyle(qrCodeContainerStyle)}>
                <QRCodeSkia
                    style={{ backgroundColor: colorVariants.standard.backgroundSurfaceElevation1 }}
                    color={colorVariants.standard.backgroundNeutralBold}
                    size={QRCODE_SIZE}
                    value={data}
                    logoAreaSize={logoProps?.logoAreaSize}
                    shapeOptions={shapeOptions}
                    logo={logoProps?.logo}
                >
                    {networkColor && (
                        <RadialGradient
                            c={{ x: QRCODE_SIZE / 2, y: QRCODE_SIZE / 2 }}
                            r={QRCODE_SIZE * 0.8}
                            colors={[networkColor, colorVariants.standard.backgroundNeutralBold]}
                        />
                    )}
                </QRCodeSkia>
            </View>
        </Box>
    );
};
