import { TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { CryptoIcon } from '@suite-common/icons-deprecated';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Text, Switch, VStack } from '@suite-native/atoms';
import {
    selectDeviceEnabledDiscoveryNetworkSymbols,
    toggleEnabledDiscoveryNetworkSymbol,
} from '@suite-native/discovery';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useToast } from '@suite-native/toasts';
import { Translation } from '@suite-native/intl';
import { isCoinWithTokens } from '@suite-native/tokens';
import { useAlert } from '@suite-native/alerts';
import { selectIsDeviceConnected } from '@suite-common/wallet-core';
import { analytics, EventType } from '@suite-native/analytics';

type NetworkSymbolSwitchItemProps = {
    networkSymbol: NetworkSymbol;
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

const wrapperStyle = prepareNativeStyle(_ => ({
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 12,
    alignItems: 'center',
    flex: 1,
}));

const iconWrapperStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.small,
}));

export const NetworkSymbolSwitchItem = ({
    networkSymbol,
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
    const { name } = networks[networkSymbol];

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
            enabledNetworkSymbols.includes(networkSymbol)
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
        dispatch(toggleEnabledDiscoveryNetworkSymbol(networkSymbol));

        if (allowChangeAnalytics) {
            analytics.report({
                type: EventType.SettingsChangeCoinEnabled,
                payload: {
                    symbol: networkSymbol,
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
                testID={`@coin-enabling/toggle-${networkSymbol}`}
            >
                <HStack style={applyStyle(wrapperStyle)}>
                    <View style={applyStyle(iconWrapperStyle)}>
                        <CryptoIcon symbol={networkSymbol} />
                    </View>
                    <HStack
                        justifyContent="space-between"
                        spacing={12}
                        flex={1}
                        alignItems="center"
                    >
                        <VStack spacing={0}>
                            <Text variant="callout">{name}</Text>
                            {isCoinWithTokens(networkSymbol) && (
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
