import { ReactNode, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDevice, selectHasDeviceDiscovery } from '@suite-common/wallet-core/';
import { useAlert } from '@suite-native/alerts/';
import { Button, ButtonColorScheme } from '@suite-native/atoms/';
import { Translation, TxKeyPath } from '@suite-native/intl/';
import {
    DeviceStackParamList,
    DeviceStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation/';
import { useToast } from '@suite-native/toasts/';
import TrezorConnect from '@trezor/connect/';

type NavigationProp = StackNavigationProps<
    DeviceStackParamList,
    DeviceStackRoutes.DevicePinProtection
>;

export type ActionType = 'enable' | 'change' | 'disable';

export type ActionButtonProps = {
    children: ReactNode;
    type: ActionType;
    colorScheme?: ButtonColorScheme;
};

type ActionConfig = {
    param: boolean | undefined;
    successMessageKey: TxKeyPath;
    canceledMessageKey: TxKeyPath;
};

const actionConfigMap = {
    enable: {
        param: false,
        successMessageKey: 'moduleDeviceSettings.pinProtection.actions.enable.success',
        canceledMessageKey: 'moduleDeviceSettings.pinProtection.actions.enable.canceled',
    },
    change: {
        param: undefined,
        successMessageKey: 'moduleDeviceSettings.pinProtection.actions.change.success',
        canceledMessageKey: 'moduleDeviceSettings.pinProtection.actions.change.canceled',
    },
    disable: {
        param: true,
        successMessageKey: 'moduleDeviceSettings.pinProtection.actions.disable.success',
        canceledMessageKey: 'moduleDeviceSettings.pinProtection.actions.disable.canceled',
    },
} as const satisfies Record<ActionType, ActionConfig>;

export const DevicePinActionButton = ({ children, type, colorScheme }: ActionButtonProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { showToast } = useToast();
    const { showAlert, hideAlert } = useAlert();

    const device = useSelector(selectDevice);
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);

    const showSuccess = useCallback(
        (messageKey: TxKeyPath) => {
            showToast({
                icon: 'check',
                variant: 'success',
                message: <Translation id={messageKey} />,
            });
        },
        [showToast],
    );

    const showError = useCallback(
        (titleKey: TxKeyPath, tryAgainAction: () => void) => {
            showAlert({
                title: <Translation id={titleKey} />,
                primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: <Translation id="generic.buttons.close" />,
                secondaryButtonVariant: 'redElevation0',
                onPressPrimaryButton: tryAgainAction,
                onPressSecondaryButton: () => {
                    hideAlert();
                    navigation.goBack();
                },
            });
        },
        [showAlert, hideAlert, navigation],
    );

    const changePin = useCallback(async () => {
        navigation.navigate(DeviceStackRoutes.DevicePinProtection);

        const { param, successMessageKey, canceledMessageKey } = actionConfigMap[type];
        const result = await TrezorConnect.changePin({
            device: {
                path: device?.path,
            },
            remove: param,
        });

        // TODO: Handle disconnected device

        if (result.success) {
            showSuccess(successMessageKey);
            navigation.goBack();
        } else if (result.payload.code === 'Failure_PinInvalid') {
            showError('moduleDeviceSettings.pinProtection.errors.pinInvalid', changePin);
        } else if (result.payload.code !== 'Method_Interrupted') {
            showError(canceledMessageKey, changePin);
        }
    }, [navigation, device, type, showSuccess, showError]);

    return (
        <Button onPress={changePin} colorScheme={colorScheme} size="small" isLoading={hasDiscovery}>
            {children}
        </Button>
    );
};
