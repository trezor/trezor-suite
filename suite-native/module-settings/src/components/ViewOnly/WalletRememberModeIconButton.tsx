import { ReactNode } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    ConnectDeviceSettings,
    DeviceRootState,
    deviceActions,
    selectDeviceLabelOrNameById,
    selectIsDeviceAutoEjectEnabled,
    toggleRememberDevice,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType, analytics } from '@suite-native/analytics';
import { Button, IconButton } from '@suite-native/atoms';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import { Translation } from '@suite-native/intl';
import { setViewOnlyCancelationTimestamp } from '@suite-native/settings';
import { useToast } from '@suite-native/toasts';

export const WalletRememberModeIconButton = ({
    device,
    walletNameLabel,
}: {
    device: TrezorDevice;
    walletNameLabel: ReactNode;
}) => {
    const dispatch = useDispatch();

    const isViewOnlyByDefaultEnabled = useFeatureFlag(FeatureFlag.IsViewOnlyByDefaultEnabled);
    const isDeviceAutoEjectEnabled = useSelector(selectIsDeviceAutoEjectEnabled);

    const { showAlert, hideAlert } = useAlert();

    const { showToast } = useToast();

    const deviceLabel = useSelector((state: DeviceRootState) =>
        selectDeviceLabelOrNameById(state, device?.id),
    );

    const toggleViewOnly = () => {
        const toastTranslationId =
            (device.remember ?? false)
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
            };

            // disconnected device, view-only is being disabled so it can be forgotten
            dispatch(deviceActions.forgetDevice({ device, settings }));
        } else {
            // device is connected or become remembered
            dispatch(deviceActions.rememberDevice({ device, remember: !device.remember }));
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
                    values={{ device: deviceLabel }}
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

    const handleEjectWallet = () => {
        const settings: ConnectDeviceSettings = {
            defaultWalletLoading: 'standard',
        };

        analytics.report({
            type: EventType.ViewOnlyChange,
            payload: { enabled: !device.remember, origin: 'settingsToggle' },
        });

        if (device.connected) {
            dispatch(toggleRememberDevice({ device }));
            if (device.remember) {
                showToast({
                    variant: 'default',
                    message: (
                        <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsWillBeEjected" />
                    ),
                });
            }
        } else {
            dispatch(deviceActions.forgetDevice({ device, settings }));
            showToast({
                variant: 'default',
                message: <Translation id="moduleSettings.viewOnly.autoEject.toast.walletEjected" />,
            });
        }
    };

    if (!isViewOnlyByDefaultEnabled) {
        return (
            <Button
                size="extraSmall"
                colorScheme={device.remember ? 'redElevation0' : 'primary'}
                onPress={() => (device.remember ? handleDisableViewOnly() : toggleViewOnly())}
                testID={`@settings/view-only/toggle-button/${device.features?.label}/${device.walletNumber ?? 0}`}
            >
                <Translation
                    id={
                        device.remember
                            ? 'moduleSettings.viewOnly.button.disable'
                            : 'moduleSettings.viewOnly.button.enable'
                    }
                />
            </Button>
        );
    }

    if (isDeviceAutoEjectEnabled) return null;

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <IconButton
                iconName={device.remember ? 'eject' : 'arrowUUpLeft'}
                onPress={handleEjectWallet}
                colorScheme="tertiaryElevation1"
            />
        </Animated.View>
    );
};
