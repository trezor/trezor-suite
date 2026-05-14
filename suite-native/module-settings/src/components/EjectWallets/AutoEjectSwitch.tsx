import { useDispatch, useSelector } from 'react-redux';

import { selectIsNoPhysicalDeviceConnected } from '@suite-common/device';
import { selectIsDeviceAutoEjectEnabled, toggleAutoEjectThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';

export const AutoEjectSwitch = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const { showAlert, hideAlert } = useAlert();

    const { showToast } = useToast();

    const isNoPhysicalDeviceConnected = useSelector(selectIsNoPhysicalDeviceConnected);

    const isAutoEjectEnabled = useSelector(selectIsDeviceAutoEjectEnabled);

    const onToggleAutoEject = () => {
        if (!isAutoEjectEnabled) {
            showToast({
                intent: 'neutral',
                message: isNoPhysicalDeviceConnected ? (
                    <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsEjected" />
                ) : (
                    <Translation id="moduleSettings.viewOnly.autoEject.toast.walletsWillBeEjected" />
                ),
            });
        }
        analytics.report({
            type: events.settingsAutoEjectToggleEvent.name,
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
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
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
