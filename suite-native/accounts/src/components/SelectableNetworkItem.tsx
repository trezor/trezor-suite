import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { useFormatters } from '@suite-common/formatters';
import { Icon, IconName } from '@suite-common/icons-deprecated';
import { Badge, Box, HStack, RoundedIcon, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { isCoinWithTokens } from '@suite-native/tokens';

export type SelectableAssetItemProps = {
    symbol: NetworkSymbol;
    rightIcon?: IconName;
    onPress?: (networkSymbol: NetworkSymbol) => void;
};

const selectableAssetContentStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: utils.spacings.sp8 + utils.spacings.sp4,
}));

const tokensBadgeStyle = prepareNativeStyle(utils => ({
    paddingBottom: utils.spacings.sp4 / 2,
}));

export const SelectableNetworkItem = ({ symbol, onPress, rightIcon }: SelectableAssetItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { NetworkSymbolFormatter } = useFormatters();

    const handlePress = () => {
        if (!onPress) return;
        onPress(symbol);
    };

    const networkName = networks[symbol].name;

    const hasTokens = isCoinWithTokens(symbol);

    return (
        <TouchableOpacity
            disabled={!onPress}
            onPress={handlePress}
            testID={`@onboarding/select-coin/${symbol}`}
        >
            <Box flexDirection="row" alignItems="center">
                <RoundedIcon name={symbol} />
                <Box style={applyStyle(selectableAssetContentStyle)}>
                    <Box flex={1} justifyContent="space-between" alignItems="flex-start">
                        <Text variant="body">{networkName}</Text>
                        <HStack alignItems="center" justifyContent="center">
                            <Text variant="hint" color="textSubdued">
                                <NetworkSymbolFormatter
                                    value={symbol}
                                    areAmountUnitsEnabled={false}
                                />
                            </Text>
                            {hasTokens && (
                                <Box style={applyStyle(tokensBadgeStyle)}>
                                    <Badge
                                        label={<Translation id="generic.tokens" />}
                                        variant="neutral"
                                        size="small"
                                    />
                                </Box>
                            )}
                        </HStack>
                    </Box>
                </Box>
                {rightIcon && <Icon name={rightIcon} color="iconDisabled" size="large" />}
            </Box>
        </TouchableOpacity>
    );
};
