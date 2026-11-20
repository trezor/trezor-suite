import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectSelectedDeviceLabelOrName } from '@suite-common/device';
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

export const useFirmwareUpdateAlert = (featureName: string) => {
    const navigation = useNavigation<NavigationProps>();
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);

    return useCallback(() => {
        showAlert({
            title: (
                <Translation id="moduleAccounts.accountDetail.stablecoinYield.firmwareUpdateAlert.title" />
            ),
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.firmwareUpdateAlert.description',
                {
                    name: deviceLabel,
                    featureName,
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
    }, [deviceLabel, featureName, navigation, showAlert, translate]);
};
