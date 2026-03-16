import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceStaticSessionId } from '@suite-common/device';
import {
    type WithSuiteSyncAndDeviceState,
    selectSuiteSyncInteraction,
} from '@suite-common/suite-sync';
import { useAlert } from '@suite-native/alerts';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import { exhaustive } from '@trezor/type-utils';

import { suiteSyncErrorMessageMap } from '../suiteSyncErrorMessages';

export const useTurnOnSuiteSyncGuard = () => {
    const { showAlert } = useAlert();
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();
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

    const suiteSyncInteraction = useSelector((state: WithSuiteSyncAndDeviceState) =>
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
            primaryButtonVariant: 'blueBold',
            secondaryButtonVariant: 'blueElevation0',
            secondaryButtonTitle: (
                <Translation id="suiteSync.firmwareUpdateAlert.secondaryButtonTitle" />
            ),
        });
    };

    const turnOnSuiteSync = async (onSuccess: () => void) => {
        if (!deviceStaticSessionId) return;

        const result = await suiteSync.turnOnSuiteSync({
            deviceStaticSessionId,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'DeviceCancelled':
                case 'DeviceError':
                    showToast({
                        variant: 'error',
                        icon: 'warning',
                        message: translate(suiteSyncErrorMessageMap[type]),
                    });

                    return;
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                    showSuiteSyncFirmwareUpgradeAlert();

                    return;
                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    return;

                default:
                    return exhaustive(type);
            }
        }

        onSuccess();
    };

    const showSuiteSyncEnableConfirmationAlert = (onSuccess: () => void) => {
        showAlert({
            title: <Translation id="suiteSync.enableAlert.title" />,
            description: <Translation id="suiteSync.enableAlert.description" />,
            primaryButtonTitle: <Translation id="suiteSync.enableAlert.cta" />,
            onPressPrimaryButton: () => turnOnSuiteSync(onSuccess),
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
        });
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
                    const result = await suiteSync.ensureWalletSuiteSyncOn({
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
