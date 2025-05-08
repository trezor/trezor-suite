import { TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { changeCoinVisibility, selectIsDeviceConnected } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { Card, HStack, Switch, Text, VStack } from '@suite-native/atoms';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { isCoinWithTokens } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type NetworkSymbolSwitchItemProps = {
    symbol: NetworkSymbol;
    isEnabled: boolean;
    allowDeselectLastCoin: boolean;
    allowChangeAnalytics?: boolean;
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
    allowDeselectLastCoin,
    allowChangeAnalytics,
}: NetworkSymbolSwitchItemProps) => {
    const dispatch = useDispatch();
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);
    const { applyStyle } = useNativeStyles();
    const { showToast } = useToast();
    const { showAlert } = useAlert();
    const { name } = getNetwork(symbol);

    const showOneNetworkSymbolAlert = () =>
        showAlert({
            title: <Translation id="moduleSettings.coinEnabling.oneNetworkSymbolAlert.title" />,
            description: (
                <Translation id="moduleSettings.coinEnabling.oneNetworkSymbolAlert.description" />
            ),
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            primaryButtonVariant: 'redBold',
        });

    const handleEnabledChange = (isChecked: boolean) => {
        if (
            !isChecked &&
            !allowDeselectLastCoin &&
            enabledNetworkSymbols.length === 1 &&
            enabledNetworkSymbols.includes(symbol)
        ) {
            showOneNetworkSymbolAlert();

            return;
        }

        if (!isDeviceConnected) {
            showToast({
                variant: 'default',
                message: isChecked ? (
                    <Translation
                        id="moduleSettings.coinEnabling.toasts.coinEnabled"
                        values={{ coin: name }}
                    />
                ) : (
                    <Translation
                        id="moduleSettings.coinEnabling.toasts.coinDisabled"
                        values={{ coin: name }}
                    />
                ),
            });
        }
        dispatch(changeCoinVisibility({ symbol, shouldBeVisible: isChecked }));

        if (allowChangeAnalytics) {
            analytics.report({
                type: EventType.SettingsChangeCoinEnabled,
                payload: {
                    symbol,
                    value: isChecked,
                },
            });
        }
    };

    return (
        <Card style={applyStyle(cardStyle, { isEnabled })}>
            <TouchableOpacity
                onPress={_ => handleEnabledChange(!isEnabled)}
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

                        <Switch onChange={handleEnabledChange} isChecked={isEnabled} />
                    </HStack>
                </HStack>
            </TouchableOpacity>
        </Card>
    );
};
