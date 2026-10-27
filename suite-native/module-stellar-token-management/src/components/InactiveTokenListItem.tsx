import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type StellarTokenInfo } from '@suite-common/wallet-types';
import { Box, PressableOpacity } from '@suite-native/atoms';
import { TokenName } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type InactiveTokenListItemProps = {
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
    backgroundColor: utils.colors.surfaceFillSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: utils.spacings.sp12,
}));

export const InactiveTokenListItem = ({ token, onPress }: InactiveTokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity onPress={onPress}>
            <Box style={applyStyle(containerStyle)}>
                <Box style={applyStyle(iconContainerStyle)}>
                    <TokenIcon
                        networkSymbol={asNetworkSymbol('xlm')}
                        contractAddress={token.contract}
                        tokenSymbol={token.symbol || token.name}
                        size="small"
                    />
                </Box>
                <Box flex={1}>
                    <TokenName
                        text={token.name || token.symbol || ''}
                        networkSymbol={asNetworkSymbol('xlm')}
                        tokenContract={token.contract}
                    />
                    <TokenName
                        text={token.symbol ?? ''}
                        networkSymbol={asNetworkSymbol('xlm')}
                        tokenContract={token.contract}
                        variant="body-sm"
                        color="contentSecondary"
                    />
                </Box>
            </Box>
        </PressableOpacity>
    );
};
