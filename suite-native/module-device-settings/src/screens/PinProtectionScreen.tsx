import { useSelector } from 'react-redux';

import { selectIsDeviceProtectedByPin } from '@suite-common/wallet-core';
import { Card, PictogramTitleHeader, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader } from '@suite-native/navigation';

import { DevicePinActionButton } from '../components/DevicePinActionButton';

const EnablePinCard = () => (
    <>
        <PictogramTitleHeader
            variant="warning"
            icon="warning"
            title={<Translation id="moduleDeviceSettings.pinProtection.pictograms.enable.title" />}
            subtitle={
                <Translation id="moduleDeviceSettings.pinProtection.pictograms.enable.subtitle" />
            }
        />
        <DevicePinActionButton type="enable" colorScheme="yellowBold">
            <Translation id="moduleDeviceSettings.pinProtection.buttons.setPin" />
        </DevicePinActionButton>
    </>
);

const DisableOrChangePinCard = () => (
    <>
        <PictogramTitleHeader
            variant="success"
            icon="check"
            title={<Translation id="moduleDeviceSettings.pinProtection.pictograms.change.title" />}
        />
        <VStack>
            <DevicePinActionButton type="change" colorScheme="primary">
                <Translation id="moduleDeviceSettings.pinProtection.buttons.changePin" />
            </DevicePinActionButton>
            <DevicePinActionButton type="disable" colorScheme="tertiaryElevation0">
                <Translation id="moduleDeviceSettings.pinProtection.buttons.removePin" />
            </DevicePinActionButton>
        </VStack>
    </>
);

export const PinProtectionScreen = () => {
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);

    return (
        <Screen header={<ScreenHeader closeActionType="close" />}>
            <VStack spacing="sp32" marginTop="sp16">
                <VStack>
                    <Text variant="titleMedium">
                        <Translation id="moduleDeviceSettings.pinProtection.title" />
                    </Text>
                    <Text color="textSubdued">
                        <Translation id="moduleDeviceSettings.pinProtection.content" />
                    </Text>
                </VStack>
                <Card>
                    <VStack spacing="sp32">
                        {isDeviceProtectedByPin ? <DisableOrChangePinCard /> : <EnablePinCard />}
                    </VStack>
                </Card>
            </VStack>
        </Screen>
    );
};
