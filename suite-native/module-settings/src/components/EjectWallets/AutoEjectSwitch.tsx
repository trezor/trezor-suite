import { useDispatch, useSelector } from 'react-redux';

import {
    selectIsDeviceAutoEjectEnabled,
    selectIsNoPhysicalDeviceConnected,
    toggleAutoEjectThunk,
} from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { EventType } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useLegacyAnalytics } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';

export const AutoEjectSwitch = () => {
    const dispatch = useDispatch();
    const legacyAnalytics = useLegacyAnalytics();
    const { showAlert, hideAlert } = useAlert();

    const { showToast } = useToast();

    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);

    const isAutoEjectEnabled = useSelector(selectIsDeviceAutoEjectEnabled);

    const onToggleAutoEject = () => {
        if (!isAutoEjectEnabled) {
            showToast({
                variant: 'default',
                message: isNoPhysicalDeviceConnected ? (
                    <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsEjected" />
                ) : (
                    <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsWillBeEjected" />
                ),
            });
        }
        legacyAnalytics.report({
            type: EventType.SettingsAutoEjectToggle,
            payload: {
                enabled: !isAutoEjectEnabled,
            },
        });
        dispatch(toggleAutoEjectThunk());
    };

    const handleToggleAutoEject = () => {
        if (isAutoEjectEnabled) {
            onToggleAutoEject();
        } else {
            showAlert({
                title: (
                    <>
                        <Translation id="moduleSettings.viewOnly.autoEject.switch.alert.titleNoConnectedTrezor" />
                        {!isNoPhysicalDeviceConnected && (
                            <Translation id="moduleSettings.viewOnly.autoEject.switch.alert.titleConnectedTrezor" />
                        )}
                    </>
                ),
                primaryButtonTitle: (
                    <Translation id="moduleSettings.viewOnly.autoEject.switch.alert.primaryButtonTitle" />
                ),
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                secondaryButtonVariant: 'redElevation0',
                onPressSecondaryButton: hideAlert,
                onPressPrimaryButton: onToggleAutoEject,
            });
        }
    };

    return (
        <TouchableSwitchRow
            isChecked={isAutoEjectEnabled}
            onChange={handleToggleAutoEject}
            accessibilityLabel="autoEjectToggle"
            text={<Translation id="moduleSettings.viewOnly.autoEject.switch.title" />}
            description={<Translation id="moduleSettings.viewOnly.autoEject.switch.description" />}
            icon="eject"
            testID="@settings/auto-eject-toggle"
        />
    );
};
