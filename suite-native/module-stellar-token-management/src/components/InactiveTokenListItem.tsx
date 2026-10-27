import { useSelector } from 'react-redux';

import {
    type TokenDefinitionsRootState,
    selectIsSpecificCoinDefinitionKnown,
} from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type StellarTokenInfo } from '@suite-common/wallet-types';
import { BlurUrls, Box, PressableOpacity, Text } from '@suite-native/atoms';
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
    const isRecognized = useSelector((state: TokenDefinitionsRootState) =>
        selectIsSpecificCoinDefinitionKnown(state, asNetworkSymbol('xlm'), token.contract),
    );

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
                    {isRecognized ? (
                        <Text variant="body-md">{token.name || token.symbol}</Text>
                    ) : (
                        <BlurUrls text={token.name || token.symbol || ''} />
                    )}
                    <Text variant="body-sm" color="contentSecondary">
                        {isRecognized ? (
                            token.symbol
                        ) : (
                            <BlurUrls
                                text={token.symbol ?? ''}
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        )}
                    </Text>
                </Box>
            </Box>
        </PressableOpacity>
    );
};
