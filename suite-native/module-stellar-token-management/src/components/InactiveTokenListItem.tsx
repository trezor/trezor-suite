import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Box, PressableOpacity } from '@suite-native/atoms';
import { TokenIcon, TokenName, TokenSymbol } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type InactiveTokenListItemProps = {
    networkSymbol: NetworkSymbol;
    tokenContract: TokenAddress;
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

export const InactiveTokenListItem = ({
    networkSymbol,
    tokenContract,
    onPress,
}: InactiveTokenListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <PressableOpacity onPress={onPress}>
            <Box style={applyStyle(containerStyle)}>
                <Box style={applyStyle(iconContainerStyle)}>
                    <TokenIcon
                        networkSymbol={networkSymbol}
                        contractAddress={tokenContract}
                        size="small"
                    />
                </Box>
                <Box flex={1}>
                    <TokenName networkSymbol={networkSymbol} contractAddress={tokenContract} />
                    <TokenSymbol
                        networkSymbol={networkSymbol}
                        contractAddress={tokenContract}
                        variant="body-sm"
                        color="contentSecondary"
                    />
                </Box>
            </Box>
        </PressableOpacity>
    );
};
