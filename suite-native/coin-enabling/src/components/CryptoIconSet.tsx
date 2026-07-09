import {
    type NetworkSymbol,
    getNetwork,
    getRepresentativeAssets,
} from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type CryptoIconSetProps = {
    symbol: NetworkSymbol;
};

const ICON_SIZE = 20;
const RING_WIDTH = 2;
const ICONS_OVERLAP = 8;

const bubbleStyle = prepareNativeStyle<{ isFirst: boolean; zIndex: number }>(
    (utils, { isFirst, zIndex }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        width: ICON_SIZE + RING_WIDTH * 2,
        height: ICON_SIZE + RING_WIDTH * 2,
        marginLeft: isFirst ? 0 : -ICONS_OVERLAP,
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
    paddingHorizontal: utils.spacings.sp4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillNeutralSofter,
    zIndex: 0,
}));

export const CryptoIconSet = ({ symbol }: CryptoIconSetProps) => {
    const { applyStyle } = useNativeStyles();

    const assets = getRepresentativeAssets(symbol);

    if (assets.length === 0) {
        return null;
    }

    const showCount = assets.length > 1;

    // Native coins have no contract – render their icon via the settlement layer symbol
    // (e.g. Base/Arbitrum... → ETH), falling back to the network symbol itself.
    const nativeCoinSymbol = getNetwork(symbol).settlementLayer ?? symbol;

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
                    <CryptoIcon
                        symbol={asset.contract ? symbol : nativeCoinSymbol}
                        contractAddress={asset.contract}
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
