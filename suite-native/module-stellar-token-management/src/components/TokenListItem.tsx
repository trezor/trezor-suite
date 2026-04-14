import { Pressable } from 'react-native';

import { type StellarTokenInfo } from '@suite-common/wallet-types';
import { Box, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type TokenListItemProps = {
    token: StellarTokenInfo;
    onPress: () => void;
};

const containerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
}));

const iconContainerStyle = prepareNativeStyle(utils => ({
    width: utils.spacings.sp40,
    height: utils.spacings.sp40,
    borderRadius: utils.borders.radii.r20,
    backgroundColor: utils.colors.legacyBackgroundSurfaceElevation2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: utils.spacings.sp12,
}));

export const TokenListItem = ({ token, onPress }: TokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable onPress={onPress}>
            <Box style={applyStyle(containerStyle)}>
                <Box style={applyStyle(iconContainerStyle)}>
                    <CryptoIcon symbol="xlm" contractAddress={token.contract} size="small" />
                </Box>
                <Box flex={1}>
                    <Text variant="body-md">{token.name || token.symbol}</Text>
                    <Text variant="body-sm" color="contentSecondary">
                        {token.symbol}
                    </Text>
                </Box>
            </Box>
        </Pressable>
    );
};
