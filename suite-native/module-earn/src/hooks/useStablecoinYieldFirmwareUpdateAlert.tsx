import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDevice, selectSelectedDeviceLabelOrName } from '@suite-common/device';
import { type YieldFlowType, isStablecoinYieldSupported } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    DeviceSettingsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.DeviceSettingsStack
>;

export const useStablecoinYieldFirmwareUpdateAlert = () => {
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const selectedDevice = useSelector(selectSelectedDevice);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    const isFirmwareSupported = useCallback(
        (flowType: YieldFlowType) => isStablecoinYieldSupported(selectedDevice, flowType),
        [selectedDevice],
    );

    const showFirmwareUpdateAlert = useCallback(() => {
        showAlert({
            title: (
                <Translation id="moduleAccounts.accountDetail.stablecoinYield.firmwareUpdateAlert.title" />
            ),
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.firmwareUpdateAlert.description',
                {
                    name: deviceLabel,
                    featureName: translate('earn.stablecoinYield'),
                },
            ),
            primaryButtonTitle: (
                <Translation id="moduleAccounts.accountDetail.stablecoinYield.firmwareUpdateAlert.primaryButtonTitle" />
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
                <Translation id="moduleAccounts.accountDetail.stablecoinYield.firmwareUpdateAlert.secondaryButtonTitle" />
            ),
            testID: '@account-detail/stablecoin-yield/firmware-update-alert',
        });
    }, [deviceLabel, navigation, showAlert, translate]);

    return {
        isFirmwareSupported,
        showFirmwareUpdateAlert,
    };
};
