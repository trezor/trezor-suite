import { Box, Text } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type YieldClaimToken } from '../types';

const MAX_ICONS_WITHOUT_OVERFLOW = 3;
const MAX_VISIBLE_ICONS_WITH_OVERFLOW = 2;
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
    tokens: YieldClaimToken[];
};

export const EarnClaimTokenIconSet = ({ tokens }: EarnClaimTokenIconSetProps) => {
    const { applyStyle } = useNativeStyles();
    const hasOverflow = tokens.length > MAX_ICONS_WITHOUT_OVERFLOW;
    const visibleIconCount = hasOverflow
        ? MAX_VISIBLE_ICONS_WITH_OVERFLOW
        : MAX_ICONS_WITHOUT_OVERFLOW;
    const overflowCount = tokens.length - visibleIconCount;

    return (
        <Box flexDirection="row" alignItems="center" testID="@earn/claim-token-icons">
            {tokens.slice(0, visibleIconCount).map((token, index) => (
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
                        applyStyle(iconWrapperStyle, { index: visibleIconCount }),
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
