import { Box, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { type MyAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

export type TokenIconGroupProps = {
    assets: MyAsset[];
    testID?: string;
};

const MAX_VISIBLE_ICONS = 2;
const ICON_SIZE = 24;

const iconWrapperStyle = prepareNativeStyle<{ index: number }>((utils, { index }) => ({
    marginLeft: index === 0 ? 0 : -utils.spacings.sp8,
}));

const overflowBadgeStyle = prepareNativeStyle(({ colors }) => ({
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.elementFillContrast,
    borderRadius: ICON_SIZE / 2,
    height: ICON_SIZE,
    width: ICON_SIZE,
}));

export const TokenIconGroup = ({ assets, testID }: TokenIconGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const overflowCount = assets.length - MAX_VISIBLE_ICONS;

    return (
        <Box flexDirection="row" alignItems="center" testID={testID}>
            {assets.slice(0, MAX_VISIBLE_ICONS).map((asset, index) => (
                <Box
                    key={`${asset.symbol}_${asset.contract ?? asset.cryptoId}_${index}`}
                    style={applyStyle(iconWrapperStyle, { index })}
                    testID={testID ? `${testID}/icon-${index}` : undefined}
                >
                    <TokenIcon
                        symbol={asset.symbol}
                        contractAddress={asset.contract}
                        size="extraSmall"
                    />
                </Box>
            ))}
            {overflowCount > 0 && (
                <Box
                    style={[
                        applyStyle(iconWrapperStyle, { index: MAX_VISIBLE_ICONS }),
                        applyStyle(overflowBadgeStyle),
                    ]}
                    testID={testID ? `${testID}/overflow` : undefined}
                >
                    <Text variant="body-sm-strong" color="contentPrimaryInverse">
                        +{overflowCount}
                    </Text>
                </Box>
            )}
        </Box>
    );
};
