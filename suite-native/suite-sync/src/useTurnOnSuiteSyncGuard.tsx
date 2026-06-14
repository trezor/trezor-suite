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
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AuthorizeDeviceStackRoutes,
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

import { suiteSyncErrorMessageMap } from './suiteSyncErrorMessages';
import { useShowSuiteSyncEnabledToast } from './useShowSuiteSyncEnabledToast';

export const useTurnOnSuiteSyncGuard = () => {
    const { showAlert } = useAlert();

    const { ensureWalletSuiteSyncOn, turnOnSuiteSync } = useServices(
        selectEnsureWalletSuiteSyncOnDep,
        selectTurnOnSuiteSyncDep,
    );

    const { showToast } = useToast();
    const { showSuiteSyncEnabledToast } = useShowSuiteSyncEnabledToast();
    const { translate } = useTranslate();
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

        const result = await turnOnSuiteSync({
            deviceStaticSessionId,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'DeviceCancelled':
                case 'DeviceError':
                case 'QuotaManagerCommunicationFailed':
                    showToast({
                        intent: 'critical',
                        icon: 'warning',
                        message: translate(suiteSyncErrorMessageMap[type]),
                    });

                    return;
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    showSuiteSyncFirmwareUpgradeAlert();

                    return;
                case 'DeviceNotConnectedError':
                    // A disconnected device is an expected condition — Suite Sync stays enabled
                    // and will retry once the device reconnects, so we stay silent.
                    return;
                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    return;

                default:
                    return exhaustive(type);
            }
        }

        showSuiteSyncEnabledToast();

        onSuccess();
    };

    const showSuiteSyncEnableConfirmationAlert = (onSuccess: () => void) => {
        if (!isDeviceConnected) {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.DeviceConnectionGuard,
            });
        } else {
            showAlert({
                title: <Translation id="suiteSync.enableAlert.title" />,
                description: <Translation id="suiteSync.enableAlert.description" />,
                primaryButtonTitle: <Translation id="suiteSync.enableAlert.cta" />,
                onPressPrimaryButton: () => handleTurnOnSuiteSync(onSuccess),
                secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            });
        }
    };

    const handleAddLabel = async (onSuccess: () => void) => {
        switch (suiteSyncInteraction) {
            case 'suite-sync-off':
                showSuiteSyncEnableConfirmationAlert(onSuccess);
                break;
            case 'firmware-upgrade-needed':
                showSuiteSyncFirmwareUpgradeAlert();
                break;
            case 'keys-needed':
                if (deviceStaticSessionId) {
                    const result = await ensureWalletSuiteSyncOn({
                        deviceStaticSessionId,
                        isWriteMode: false,
                    });

                    if (result.success) {
                        onSuccess();
                    }
                }
                break;
            default:
                onSuccess();

                return;
        }
    };

    return { handleAddLabel };
};
