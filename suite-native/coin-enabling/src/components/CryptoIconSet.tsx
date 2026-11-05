import { getNativeAssetIconSymbol } from '@suite-common/icons';
import { type RepresentativeAsset } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type CryptoIconSetProps = {
    symbol: NetworkSymbol;
    assets?: readonly RepresentativeAsset[];
};

const ICON_SIZE = 24;
const RING_WIDTH = 2;
const ICONS_OVERLAP = 8;

const bubbleStyle = prepareNativeStyle<{ isFirst: boolean; zIndex: number }>(
    (utils, { isFirst, zIndex }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        width: ICON_SIZE + RING_WIDTH * 2,
        height: ICON_SIZE + RING_WIDTH * 2,
        marginLeft: isFirst ? -RING_WIDTH : -ICONS_OVERLAP,
        borderRadius: utils.borders.radii.round,
        backgroundColor: utils.colors.surfaceFillRaised,
        zIndex,
    }),
);

const countStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    justifyContent: 'center',
    height: ICON_SIZE + RING_WIDTH * 2,
    marginLeft: -ICONS_OVERLAP + utils.spacings.sp2,
    paddingHorizontal: utils.spacings.sp6,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillNeutralSofter,
    zIndex: 0,
}));

export const CryptoIconSet = ({ symbol, assets }: CryptoIconSetProps) => {
    const { applyStyle } = useNativeStyles();

    if (!assets?.length) {
        return null;
    }

    const showCount = assets.length > 1;

    const nativeCoinSymbol = getNativeAssetIconSymbol(symbol);

    return (
        <Box flexDirection="row" alignItems="center">
            {assets.map((asset, index) => (
                <Box
                    key={asset.contract ?? asset.symbol}
                    style={applyStyle(bubbleStyle, {
                        isFirst: index === 0,
                        zIndex: assets.length - index,
                    })}
                >
                    <TokenIcon
                        networkSymbol={asset.contract ? symbol : nativeCoinSymbol}
                        contractAddress={asset.contract}
                        tokenSymbol={asset.symbol}
                        size={ICON_SIZE}
                    />
                </Box>
            ))}
            {showCount && (
                <Box style={applyStyle(countStyle)}>
                    <Text variant="body-xs" color="contentSecondary">
                        <Translation id="moduleSettings.coinEnabling.labels.more" />
                    </Text>
                </Box>
            )}
        </Box>
    );
};
