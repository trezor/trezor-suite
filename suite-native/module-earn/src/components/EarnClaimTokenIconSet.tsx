import { Box, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type StablecoinYieldClaimToken } from '../types';

const MAX_VISIBLE_ICONS = 2;
const ICON_SIZE = 20;

const iconWrapperStyle = prepareNativeStyle<{ index: number }>((utils, { index }) => ({
    marginLeft: index === 0 ? 0 : -utils.spacings.sp8,
}));

const overflowBadgeStyle = prepareNativeStyle(utils => ({
    alignItems: 'center',
    justifyContent: 'center',
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.elementFillContrast,
}));

type EarnClaimTokenIconSetProps = {
    tokens: StablecoinYieldClaimToken[];
};

export const EarnClaimTokenIconSet = ({ tokens }: EarnClaimTokenIconSetProps) => {
    const { applyStyle } = useNativeStyles();
    const overflowCount = tokens.length - MAX_VISIBLE_ICONS;

    return (
        <Box flexDirection="row" alignItems="center" testID="@earn/claim-token-icons">
            {tokens.slice(0, MAX_VISIBLE_ICONS).map((token, index) => (
                <Box
                    key={`${token.networkSymbol}:${token.contractAddress}`}
                    style={applyStyle(iconWrapperStyle, { index })}
                >
                    <TokenIcon
                        symbol={token.networkSymbol}
                        contractAddress={token.contractAddress}
                        size={ICON_SIZE}
                    />
                </Box>
            ))}
            {overflowCount > 0 && (
                <Box
                    style={[
                        applyStyle(iconWrapperStyle, { index: MAX_VISIBLE_ICONS }),
                        applyStyle(overflowBadgeStyle),
                    ]}
                    testID="@earn/claim-token-icons/overflow"
                >
                    <Text variant="body-xs" color="contentPrimaryInverse">
                        +{overflowCount}
                    </Text>
                </Box>
            )}
        </Box>
    );
};
