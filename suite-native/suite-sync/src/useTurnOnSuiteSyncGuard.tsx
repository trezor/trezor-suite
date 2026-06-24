import { useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectDeviceStaticSessionId, selectIsDeviceConnected } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import {
    selectEnsureWalletSuiteSyncOnDep,
    selectTurnOnSuiteSyncDep,
} from '@suite-common/suite-sync-types';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { useShowSuiteSyncEnabledToast } from './useShowSuiteSyncEnabledToast';
import { useSuiteSyncErrorHandler } from './useSuiteSyncErrorHandler';

export const useTurnOnSuiteSyncGuard = () => {
    const { showAlert } = useAlert();
    const isAddLabelRequestInProgressRef = useRef(false);

    const { ensureWalletSuiteSyncOn, turnOnSuiteSync } = useServices(
        selectEnsureWalletSuiteSyncOnDep,
        selectTurnOnSuiteSyncDep,
    );

    const { showSuiteSyncEnabledToast } = useShowSuiteSyncEnabledToast();
    const { handleSuiteSyncError } = useSuiteSyncErrorHandler();
    const navigation =
        useNavigation<
            StackToStackCompositeNavigationProps<
                RootStackParamList,
                RootStackRoutes,
                RootStackParamList
            >
        >();
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const isDeviceConnected = useSelector(selectIsDeviceConnected);

    const suiteSyncInteraction = useSelector(
        (state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
            selectSuiteSyncInteraction(state, deviceStaticSessionId),
    );

    const showSuiteSyncFirmwareUpgradeAlert = () => {
        showAlert({
            title: <Translation id="suiteSync.firmwareUpdateAlert.title" />,
            description: <Translation id="suiteSync.firmwareUpdateAlert.description" />,
            primaryButtonTitle: (
                <Translation id="suiteSync.firmwareUpdateAlert.primaryButtonTitle" />
            ),
            onPressPrimaryButton: () => {
                navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
                    screen: DeviceSettingsStackRoutes.DeviceFirmware,
                    params: { closeActionType: 'close' },
                });
            },
            primaryButtonColorProps: { intent: 'info', priority: 'primary' },
            secondaryButtonColorProps: { intent: 'info', priority: 'secondary' },
            secondaryButtonTitle: (
                <Translation id="suiteSync.firmwareUpdateAlert.secondaryButtonTitle" />
            ),
        });
    };

    const handleTurnOnSuiteSync = async (onSuccess: () => void) => {
        if (!deviceStaticSessionId) return;

        const result = await turnOnSuiteSync({ deviceStaticSessionId });

        if (!result.success) {
            handleSuiteSyncError(result.error);

            return;
        }

        showSuiteSyncEnabledToast();

        onSuccess();
    };

    const showSuiteSyncEnableConfirmationAlert = ({
        onSuccess,
        onCancel,
    }: {
        onSuccess: () => void;
        onCancel: () => void;
    }) => {
        if (!isDeviceConnected) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            });
            onCancel();
        } else {
            showAlert({
                title: <Translation id="suiteSync.enableAlert.title" />,
                description: <Translation id="suiteSync.enableAlert.description" />,
                primaryButtonTitle: <Translation id="suiteSync.enableAlert.cta" />,
                onPressPrimaryButton: () => handleTurnOnSuiteSync(onSuccess),
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                onPressSecondaryButton: onCancel,
            });
        }
    };

    const handleAddLabel = async (onSuccess: () => void) => {
        if (isAddLabelRequestInProgressRef.current) return;

        isAddLabelRequestInProgressRef.current = true;

        const releaseAddLabelRequest = () => {
            isAddLabelRequestInProgressRef.current = false;
        };

        const handleSuccess = () => {
            releaseAddLabelRequest();
            onSuccess();
        };

        switch (suiteSyncInteraction) {
            case 'suite-sync-off':
                showSuiteSyncEnableConfirmationAlert({
                    onSuccess: handleSuccess,
                    onCancel: releaseAddLabelRequest,
                });

                return;

            case 'firmware-upgrade-needed':
                showSuiteSyncFirmwareUpgradeAlert();
                releaseAddLabelRequest(); // Alert only informative, it then redirects user.

                return;

            case 'keys-needed': {
                if (!deviceStaticSessionId) {
                    releaseAddLabelRequest();

                    return;
                }

                const result = await ensureWalletSuiteSyncOn({
                    deviceStaticSessionId,
                    isWriteMode: false,
                });

                if (!result.success) {
                    handleSuiteSyncError(result.error);

                    releaseAddLabelRequest();

                    return;
                }

                handleSuccess();

                return;
            }

            case 'unsupported':
            case null:
                handleSuccess();

                return;

            default:
                return exhaustive(suiteSyncInteraction);
        }
    };

    return { handleAddLabel };
};
