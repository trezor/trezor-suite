import { useDispatch, useSelector } from 'react-redux';

import { Button, HStack, Loader, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    ConnectDeviceSettings,
    DeviceRootState,
    DiscoveryRootState,
    deviceActions,
    selectIsDiscoveryActiveByDeviceState,
    toggleRememberDevice,
} from '@suite-common/wallet-core';
import { analytics, EventType } from '@suite-native/analytics';
import { useAlert } from '@suite-native/alerts';
import { useToast } from '@suite-native/toasts';
import { Icon } from '@suite-common/icons';
import { TrezorDevice } from '@suite-common/suite-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { setViewOnlyCancelationTimestamp } from '@suite-native/settings';

type WalletRowProps = {
    device: TrezorDevice;
};

const walletRowStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
}));

export const WalletRow = ({ device }: WalletRowProps) => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const { showToast } = useToast();
    const { applyStyle } = useNativeStyles();
    const isDeviceDiscoveryActive = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, device.state),
    );

    const walletNameLabel = device.useEmptyPassphrase ? (
        <Translation id="moduleSettings.viewOnly.wallet.standard" />
    ) : (
        <Translation
            id="moduleSettings.viewOnly.wallet.defaultPassphrase"
            values={{ index: device.walletNumber }}
        />
    );

    const toggleViewOnly = () => {
        const toastTranslationId =
            device.remember ?? false
                ? 'moduleSettings.viewOnly.toast.disabled'
                : 'moduleSettings.viewOnly.toast.enabled';
        showToast({
            variant: 'default',
            message: <Translation id={toastTranslationId} />,
            icon: 'check',
        });

        analytics.report({
            type: EventType.ViewOnlyChange,
            payload: { enabled: !device.remember, origin: 'settingsToggle' },
        });

        if (device.remember) {
            // if user disables view-only here, save the timestamp of the cancelation not to promote it later
            dispatch(setViewOnlyCancelationTimestamp(new Date().getTime()));
        }

        if (!device.connected && device.remember) {
            const settings: ConnectDeviceSettings = {
                defaultWalletLoading: 'standard',
                isViewOnlyModeVisible: false,
            };

            // disconnected device, view-only is being disabled so it can be forgotten
            dispatch(deviceActions.forgetDevice({ device, settings }));
        } else {
            // device is connected or become remembered
            dispatch(toggleRememberDevice({ device }));
        }
    };

    const handleDisableViewOnly = () => {
        showAlert({
            title: (
                <Translation
                    id="moduleSettings.viewOnly.disableDialog.title"
                    values={{ name: walletNameLabel }}
                />
            ),
            description: (
                <Translation
                    id="moduleSettings.viewOnly.disableDialog.subtitle"
                    values={{ device: device.label }}
                />
            ),
            primaryButtonTitle: (
                <Translation id="moduleSettings.viewOnly.disableDialog.buttons.primary" />
            ),
            onPressPrimaryButton: toggleViewOnly,
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: (
                <Translation id="moduleSettings.viewOnly.disableDialog.buttons.secondary" />
            ),
            onPressSecondaryButton: hideAlert,
            secondaryButtonVariant: 'redElevation0',
        });
    };

    const showToggleButton = device.remember || !isDeviceDiscoveryActive;

    return (
        <HStack key={device.instance} style={applyStyle(walletRowStyle)}>
            <HStack spacing={12} alignItems="center">
                <Icon
                    name={device.useEmptyPassphrase ? 'standardWallet' : 'password'}
                    size="mediumLarge"
                />
                <Text variant="callout">{walletNameLabel}</Text>
            </HStack>
            {showToggleButton ? (
                <Button
                    size="extraSmall"
                    colorScheme={device.remember ? 'redElevation0' : 'primary'}
                    onPress={() => (device.remember ? handleDisableViewOnly() : toggleViewOnly())}
                >
                    <Translation
                        id={
                            device.remember
                                ? 'moduleSettings.viewOnly.button.disable'
                                : 'moduleSettings.viewOnly.button.enable'
                        }
                    />
                </Button>
            ) : (
                <Loader size="small" />
            )}
        </HStack>
    );
};
