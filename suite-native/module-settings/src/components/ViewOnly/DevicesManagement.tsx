import { useDispatch, useSelector } from 'react-redux';

import { Box, Button, Card, HStack, IconButton, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { selectPhysicalDevices, toggleRememberDevice } from '@suite-common/wallet-core';
import { TrezorDevice } from '@suite-common/suite-types';
import { useAlert } from '@suite-native/alerts';
import { useToast } from '@suite-native/toasts';

import { About, AboutProps } from './About';

export const DevicesManagement = ({ onPressAbout }: AboutProps) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();
    const devices = useSelector(selectPhysicalDevices);
    const { showAlert } = useAlert();
    const { showToast } = useToast();

    const toggleViewOnly = (device: TrezorDevice) => {
        const toastTranslationId =
            device.remember ?? false
                ? 'moduleSettings.viewOnly.toast.disabled'
                : 'moduleSettings.viewOnly.toast.enabled';
        showToast({
            variant: 'default',
            message: <Translation id={toastTranslationId} />,
            icon: 'check',
        });
        dispatch(toggleRememberDevice({ device }));
    };

    const handleDisableViewOnly = (device: TrezorDevice) => {
        showAlert({
            title: translate('moduleSettings.viewOnly.disableDialog.title', { name: device.label }),
            description: <Translation id="moduleSettings.viewOnly.disableDialog.subtitle" />,
            primaryButtonTitle: (
                <Translation id="moduleSettings.viewOnly.disableDialog.buttons.primary" />
            ),
            onPressPrimaryButton: () => toggleViewOnly(device),
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: (
                <Translation id="moduleSettings.viewOnly.disableDialog.buttons.secondary" />
            ),
            secondaryButtonVariant: 'redElevation0',
        });
    };

    return (
        <>
            <Box paddingHorizontal="large">
                <About onPressAbout={onPressAbout} />
            </Box>
            {devices.map(device => (
                <Card key={device.id}>
                    <HStack justifyContent="space-between" alignItems="center">
                        <Text>{device?.label}</Text>
                        {device.remember ? (
                            <IconButton
                                colorScheme="redElevation0"
                                iconName="close"
                                onPress={() => handleDisableViewOnly(device)}
                            />
                        ) : (
                            <Button onPress={() => toggleViewOnly(device)}>
                                <Translation id="moduleSettings.viewOnly.enableButton" />
                            </Button>
                        )}
                    </HStack>
                </Card>
            ))}
        </>
    );
};
