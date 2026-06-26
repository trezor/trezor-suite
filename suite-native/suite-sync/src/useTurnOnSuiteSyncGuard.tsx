import { useState } from 'react';
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
import { useAlert, useShowAlertResult } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { type Result, err, exhaustive, ok } from '@trezor/type-utils';

import { useShowSuiteSyncEnabledToast } from './useShowSuiteSyncEnabledToast';
import { useSuiteSyncErrorHandler } from './useSuiteSyncErrorHandler';

type AddLabelSuiteSyncGuardResult = Result<void, { type: 'cancelled' }>;

export const useTurnOnSuiteSyncGuard = () => {
    const { showAlert } = useAlert();
    const { showAlertResult } = useShowAlertResult();

    const [isInProgress, setIsInProgress] = useState(false);

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

    const interaction = useSelector((state: WithSuiteSyncAndDeviceState & MessageSystemRootState) =>
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

    const handleTurnOnSuiteSync = async (): Promise<AddLabelSuiteSyncGuardResult> => {
        if (!deviceStaticSessionId) {
            return err({ type: 'cancelled' });
        }

        const result = await turnOnSuiteSync({ deviceStaticSessionId });

        if (!result.success) {
            handleSuiteSyncError(result.error);

            return err({ type: 'cancelled' });
        }

        showSuiteSyncEnabledToast();

        return ok();
    };

    const confirmSuiteSyncEnable = (): Promise<AddLabelSuiteSyncGuardResult> => {
        if (!isDeviceConnected) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            });

            return Promise.resolve(err({ type: 'cancelled' }));
        }

        return showAlertResult({
            title: <Translation id="suiteSync.enableAlert.title" />,
            description: <Translation id="suiteSync.enableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.enableAlert.cta" />,
            onPressPrimaryButton: handleTurnOnSuiteSync,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
    };

    const ensureSuiteSyncReadyForAddLabel = async (): Promise<AddLabelSuiteSyncGuardResult> => {
        switch (interaction) {
            case 'suite-sync-off': {
                return confirmSuiteSyncEnable();
            }

            case 'firmware-upgrade-needed':
                showSuiteSyncFirmwareUpgradeAlert();

                return err({ type: 'cancelled' });

            case 'keys-needed': {
                if (!deviceStaticSessionId) {
                    return err({ type: 'cancelled' });
                }

                const result = await ensureWalletSuiteSyncOn({
                    deviceStaticSessionId,
                    isWriteMode: false,
                });

                if (!result.success) {
                    handleSuiteSyncError(result.error);

                    return err({ type: 'cancelled' });
                }

                return ok();
            }

            case 'unsupported':
            case null:
                return ok();

            default:
                return exhaustive(interaction);
        }
    };

    const handleAddLabel = async (onSuccess: () => void) => {
        if (isInProgress) return;

        setIsInProgress(true);

        const result = await ensureSuiteSyncReadyForAddLabel();

        setIsInProgress(false);

        if (result.success) {
            onSuccess();
        }
    };

    return { handleAddLabel, isInProgress };
};
