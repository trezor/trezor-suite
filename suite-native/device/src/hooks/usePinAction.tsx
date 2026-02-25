import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { selectIsDeviceConnected, selectSelectedDevice } from '@suite-common/device';
import { useAlert } from '@suite-native/alerts';
import { events } from '@suite-native/analytics';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation, TxKeyPath } from '@suite-native/intl';
import { PinActionType } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import TrezorConnect from '@trezor/connect';

type ActionConfig = {
    remove: boolean | undefined;
    successMessageKey: TxKeyPath;
    canceledMessageKey: TxKeyPath;
};

const actionConfigMap = {
    enable: {
        remove: false,
        successMessageKey: 'moduleDeviceSettings.pinProtection.actions.enable.success',
        canceledMessageKey: 'moduleDeviceSettings.pinProtection.actions.enable.canceled',
    },
    change: {
        remove: undefined,
        successMessageKey: 'moduleDeviceSettings.pinProtection.actions.change.success',
        canceledMessageKey: 'moduleDeviceSettings.pinProtection.actions.change.canceled',
    },
    disable: {
        remove: true,
        successMessageKey: 'moduleDeviceSettings.pinProtection.actions.disable.success',
        canceledMessageKey: 'moduleDeviceSettings.pinProtection.actions.disable.canceled',
    },
} as const satisfies Record<PinActionType, ActionConfig>;

type PinActionProps = {
    type: PinActionType;
    onSuccess: () => void;
    onError?: (titleKey: TxKeyPath, tryAgainAction: () => void) => void;
};

export const usePinAction = ({ type, onSuccess, onError }: PinActionProps) => {
    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const device = useSelector(selectSelectedDevice);
    const navigation = useNavigation();
    const { showToast } = useToast();
    const { showAlert } = useAlert();
    const analytics = useAnalytics();
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

    const showErrorFallback = useCallback(
        (titleKey: TxKeyPath, tryAgainAction: () => void) => {
            showAlert({
                title: <Translation id={titleKey} />,
                primaryButtonTitle: <Translation id="generic.buttons.tryAgain" />,
                primaryButtonVariant: 'redBold',
                secondaryButtonTitle: <Translation id="generic.buttons.close" />,
                secondaryButtonVariant: 'redElevation0',
                onPressPrimaryButton: tryAgainAction,
                onPressSecondaryButton: () => {
                    navigation.goBack();
                },
            });
        },
        [showAlert, navigation],
    );

    const handleError = onError ?? showErrorFallback;

    const handlePinAction = useCallback(async () => {
        analytics.report({
            type: events.deviceSettingsPinProtectionChangeEvent.name,
            payload: { action: type },
        });

        const { remove, successMessageKey, canceledMessageKey } = actionConfigMap[type];

        const result = await requestPrioritizedDeviceAccess(() =>
            TrezorConnect.changePin({
                device: {
                    path: device?.path,
                },
                remove,
            }),
        );

        if (!result.success) {
            return;
        }

        const unwrappedResult = result.payload;
        if (unwrappedResult.success) {
            showSuccess(successMessageKey);
            onSuccess();
        } else {
            const errorCode = unwrappedResult.error.code;
            if (
                errorCode === 'Failure_ActionCancelled' ||
                errorCode === 'Failure_PinCancelled' ||
                errorCode === 'Method_Interrupted'
            ) {
                handleError(canceledMessageKey, handlePinAction);
            } else if (errorCode === 'Failure_PinInvalid') {
                handleError(
                    'moduleDeviceSettings.pinProtection.errors.pinInvalid',
                    handlePinAction,
                );
            } else if (errorCode === 'Failure_PinMismatch') {
                handleError(
                    'moduleDeviceSettings.pinProtection.errors.pinMismatch',
                    handlePinAction,
                );
            } else {
                navigation.goBack();
            }
        }
    }, [analytics, type, device?.path, showSuccess, onSuccess, handleError, navigation]);

    useFocusEffect(
        useCallback(() => {
            if (isDeviceConnected) handlePinAction();

            // handlePinAction is excluded as it depends on device object that could unintentionally trigger the useEffect
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isDeviceConnected]),
    );
};
