import { useCallback } from 'react';
import { Platform } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { IconListTextItem, VStack } from '@suite-native/atoms';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { TREZOR_SUPPORT_DEVICE_URL } from '@trezor/urls';

import { ConnectDeviceScreen } from '../../components/connect/ConnectDeviceScreen';
import { HINTS_ALERT_DELAY } from '../../constants';

export const ConnectAndUnlockDeviceScreen = () => {
    const { showAlert, hideAlert } = useAlert();
    const openLink = useOpenLink();

    const showConnectDeviceHintsAlert = useCallback(
        () =>
            showAlert({
                type: 'connectDevice',
                title: <Translation id="moduleConnectDevice.helpModal.connect.title" />,
                textAlign: 'left',
                primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
                primaryButtonColorProps: { intent: 'info', priority: 'primary' },
                secondaryButtonTitle: (
                    <Translation id="moduleConnectDevice.helpModal.connect.contactSupportButton" />
                ),
                secondaryButtonColorProps: { intent: 'info', priority: 'secondary' },
                onPressSecondaryButton: () => openLink(`${TREZOR_SUPPORT_DEVICE_URL}#open-chat`),
                appendix: (
                    <VStack spacing="sp12">
                        <IconListTextItem
                            icon="trezorPassword"
                            iconSize="large"
                            variant="blue"
                            textVariant="body-md"
                        >
                            <Translation id="moduleConnectDevice.helpModal.connect.hint1" />
                        </IconListTextItem>
                        <IconListTextItem
                            icon="cableUsbC"
                            iconSize="large"
                            variant="blue"
                            textVariant="body-md"
                        >
                            <Translation id="moduleConnectDevice.helpModal.connect.hint2" />
                        </IconListTextItem>
                        <IconListTextItem
                            icon="arrowsClockwise"
                            iconSize="large"
                            variant="blue"
                            textVariant="body-md"
                        >
                            <Translation id="moduleConnectDevice.helpModal.connect.hint3" />
                        </IconListTextItem>
                    </VStack>
                ),
            }),
        [showAlert, openLink],
    );

    useFocusEffect(
        useCallback(() => {
            const timeoutId = setTimeout(showConnectDeviceHintsAlert, HINTS_ALERT_DELAY);

            return () => {
                clearTimeout(timeoutId);
                hideAlert('connectDevice');
            };
        }, [showConnectDeviceHintsAlert, hideAlert]),
    );

    return (
        <ConnectDeviceScreen closeActionType={Platform.select({ android: 'back' })}>
            <ConnectAndUnlockDeviceScreenContent />
        </ConnectDeviceScreen>
    );
};
