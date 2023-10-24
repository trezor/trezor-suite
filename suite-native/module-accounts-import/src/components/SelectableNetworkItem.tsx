import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Badge, Box, HStack, RoundedIcon, Text } from '@suite-native/atoms';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';

export type SelectableAssetItemProps = {
    symbol: NetworkSymbol;
    onPress?: (networkSymbol: NetworkSymbol) => void;
};

const selectableAssetContentStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: utils.spacings.small + utils.spacings.extraSmall,
}));

const erc20BadgeStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.extraSmall / 2,
}));

export const SelectableNetworkItem = ({ symbol, onPress }: SelectableAssetItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { NetworkSymbolFormatter } = useFormatters();

    const handlePress = () => {
        if (!onPress) return;
        onPress(symbol);
    };

    const networkName = networks[symbol].name;

    const isEthereumNetwork = symbol === 'eth';

    return (
        <TouchableOpacity
            testID={`@onboarding/select-coin/${networkName}`}
            disabled={!onPress}
            onPress={handlePress}
        >
            <Box flexDirection="row" alignItems="center">
                <RoundedIcon name={symbol} />
                <Box style={applyStyle(selectableAssetContentStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="flex-start">
                        <Text variant="body">{networkName}</Text>
                        <HStack alignItems="center" justifyContent="center">
                            <Text variant="hint" color="textSubdued">
                                <NetworkSymbolFormatter value={symbol} />
                            </Text>
                            {isEthereumNetwork && (
                                <Box style={applyStyle(erc20BadgeStyle)}>
                                    <Badge label="+ ERC-20" variant="neutral" size="small" />
                                </Box>
                            )}
                        </HStack>
                    </Box>
                </Box>
            </Box>
        </TouchableOpacity>
    );
};
