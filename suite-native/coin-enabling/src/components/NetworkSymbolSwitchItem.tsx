import { TouchableOpacity, View } from 'react-native';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Card, HStack, Switch, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { isCoinWithTokens } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type NetworkSymbolSwitchItemProps = {
    symbol: NetworkSymbol;
    isEnabled: boolean;
    onToggle: (isEnabled: boolean) => void;
};

const cardStyle = prepareNativeStyle<{ isEnabled: boolean }>((utils, { isEnabled }) => ({
    padding: 0,
    extend: [
        {
            condition: !isEnabled,
            style: {
                borderColor: utils.colors.borderElevation0,
                backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation0,
                shadowColor: 'transparent',
            },
        },
    ],
}));

const wrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: utils.spacings.sp12,
    alignItems: 'center',
    flex: 1,
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp8,
}));

export const NetworkSymbolSwitchItem = ({
    symbol,
    isEnabled,
    onToggle,
}: NetworkSymbolSwitchItemProps) => {
    const { applyStyle } = useNativeStyles();
    const { name } = getNetwork(symbol);

    return (
        <Card style={applyStyle(cardStyle, { isEnabled })}>
            <TouchableOpacity
                onPress={() => onToggle(!isEnabled)}
                accessibilityRole="togglebutton"
                activeOpacity={0.6}
                testID={`@coin-enabling/toggle-${symbol}`}
            >
                <HStack style={applyStyle(wrapperStyle)}>
                    <View style={applyStyle(iconWrapperStyle)}>
                        <CryptoIcon symbol={symbol} />
                    </View>
                    <HStack
                        justifyContent="space-between"
                        spacing="sp12"
                        flex={1}
                        alignItems="center"
                    >
                        <VStack spacing={0}>
                            <Text variant="callout">{name}</Text>
                            {isCoinWithTokens(symbol) && (
                                <Text variant="hint" color="textSubdued">
                                    <Translation id="generic.tokens" />
                                </Text>
                            )}
                        </VStack>

                        <Switch onChange={onToggle} isChecked={isEnabled} />
                    </HStack>
                </HStack>
            </TouchableOpacity>
        </Card>
    );
};
