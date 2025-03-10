import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceDiscoveryActive, selectSelectedDevice } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { DeviceAuthenticityCheckResult, EventType, analytics } from '@suite-native/analytics';
import { Button, IconListTextItem, Text, VStack } from '@suite-native/atoms';
import { requestPrioritizedDeviceAccess } from '@suite-native/device-mutex';
import { Translation } from '@suite-native/intl';
import {
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { SettingsCardWithIconLayout } from '@suite-native/settings';
import TrezorConnect from '@trezor/connect';

type NavigationProp = StackToStackCompositeNavigationProps<
    DeviceAuthenticityStackParamList,
    DeviceAuthenticityStackRoutes,
    DeviceSettingsStackParamList
>;

export const DeviceAuthenticityCard = () => {
    const navigation = useNavigation<NavigationProp>();
    const isDiscoveryRunning = useSelector(selectIsDeviceDiscoveryActive);

    const { showAlert } = useAlert();

    const device = useSelector(selectSelectedDevice);

    const reportCheckResult = useCallback(
        (result: DeviceAuthenticityCheckResult) =>
            analytics.report({
                type: EventType.DeviceSettingsAuthenticityCheck,
                payload: { result },
            }),
        [],
    );

    const checkAuthenticity = useCallback(async () => {
        navigation.navigate(DeviceStackRoutes.DeviceAuthenticity);

        const result = await requestPrioritizedDeviceAccess({
            deviceCallback: () =>
                TrezorConnect.authenticateDevice({
                    device: {
                        path: device?.path,
                    },
                }),
        });
        if (!result.success) {
            return;
        }

        const { success, payload } = result.payload;
        if (success) {
            const checkResult = payload.valid ? 'successful' : 'compromised';
            const configExpired = payload.error === 'CA_PUBKEY_NOT_FOUND' && payload.configExpired;
            navigation.navigate(DeviceAuthenticityStackRoutes.AuthenticitySummary, {
                checkResult: configExpired ? 'successful' : checkResult,
            });
            reportCheckResult(configExpired ? 'configExpired' : checkResult);
        } else {
            const errorCode = payload.code;
            if (errorCode === 'Failure_ActionCancelled' || errorCode === 'Failure_PinCancelled') {
                navigation.goBack();
                reportCheckResult('cancelled');
            } else if (errorCode === 'Method_Interrupted' || errorCode === undefined) {
                // navigation.goBack() already called via the X button (or the device was disconnected)
                reportCheckResult('cancelled');
            } else {
                navigation.navigate(DeviceAuthenticityStackRoutes.AuthenticitySummary, {
                    checkResult: 'compromised',
                });
                reportCheckResult('failed');
            }
        }
    }, [device, navigation, reportCheckResult]);

    const showInfoAlert = useCallback(() => {
        showAlert({
            title: <Translation id="moduleDeviceSettings.authenticity.info.title" />,
            textAlign: 'left',
            appendix: (
                <VStack spacing="sp24">
                    <IconListTextItem icon="shieldCheck">
                        <Translation id="moduleDeviceSettings.authenticity.info.item1" />
                    </IconListTextItem>
                    <IconListTextItem icon="cpu">
                        <Translation id="moduleDeviceSettings.authenticity.info.item2" />
                    </IconListTextItem>
                    <IconListTextItem icon="check">
                        <Translation id="moduleDeviceSettings.authenticity.info.item3" />
                    </IconListTextItem>
                </VStack>
            ),
            primaryButtonTitle: (
                <Translation id="moduleDeviceSettings.authenticity.info.letsDoItButton" />
            ),
            onPressPrimaryButton: checkAuthenticity,
        });
    }, [showAlert, checkAuthenticity]);

    return (
        <SettingsCardWithIconLayout
            icon="shieldCheck"
            title={<Translation id="moduleDeviceSettings.authenticity.title" />}
        >
            <VStack marginTop="sp2" spacing="sp16">
                <Text variant="body" color="textSubdued">
                    <Translation id="moduleDeviceSettings.authenticity.content" />
                </Text>
                <Button
                    size="small"
                    colorScheme="tertiaryElevation0"
                    onPress={showInfoAlert}
                    testID="@device-authenticity/check-button"
                    disabled={isDiscoveryRunning}
                    isLoading={isDiscoveryRunning}
                >
                    <Translation id="moduleDeviceSettings.authenticity.checkButton" />
                </Button>
            </VStack>
        </SettingsCardWithIconLayout>
    );
};
