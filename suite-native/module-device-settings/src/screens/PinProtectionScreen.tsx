import { useSelector } from 'react-redux';

import { selectIsDeviceProtectedByPin } from '@suite-common/device';
import { Card, PictogramTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

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
        <DevicePinActionButton
            type="enable"
            buttonColorProps={{ intent: 'warning', priority: 'primary' }}
        >
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
        <VStack spacing="sp12">
            <DevicePinActionButton
                type="change"
                buttonColorProps={{ intent: 'brand', priority: 'primary' }}
            >
                <Translation id="moduleDeviceSettings.pinProtection.buttons.changePin" />
            </DevicePinActionButton>
            <DevicePinActionButton
                type="disable"
                buttonColorProps={{ intent: 'neutral', priority: 'secondary' }}
            >
                <Translation id="moduleDeviceSettings.pinProtection.buttons.removePin" />
            </DevicePinActionButton>
        </VStack>
    </>
);

export const PinProtectionScreen = () => {
    const isDeviceProtectedByPin = useSelector(selectIsDeviceProtectedByPin);

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.pinProtection.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.pinProtection.content" />}
                    closeActionType="back"
                />
            }
        >
            <Card>
                <VStack marginTop="sp16" spacing="sp32">
                    {isDeviceProtectedByPin ? <DisableOrChangePinCard /> : <EnablePinCard />}
                </VStack>
            </Card>
        </Screen>
    );
};
