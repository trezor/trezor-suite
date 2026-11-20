import { useNavigation } from '@react-navigation/native';

import { CardStepper } from '@suite-native/atoms';
import { useWipeDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import { DynamicScreenHeader, Screen } from '@suite-native/navigation';

import { wipeDeviceStepToContentMap } from '../constants';

export const WipeDeviceScreen = () => {
    const navigation = useNavigation();
    const { navigateToWipeDeviceStack } = useWipeDevice();

    const handleSecondaryButtonPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <Screen
            header={
                <DynamicScreenHeader
                    title={<Translation id="moduleDeviceSettings.wipeDevice.title" />}
                    subtitle={<Translation id="moduleDeviceSettings.wipeDevice.subtitle" />}
                />
            }
        >
            <CardStepper
                onFinish={navigateToWipeDeviceStack}
                secondaryButtonText={<Translation id="generic.buttons.goBack" />}
                primaryButtonText={<Translation id="generic.buttons.understand" />}
                buttonsActionType="destructive"
                onPressSecondaryButton={handleSecondaryButtonPress}
                stepToContentMap={wipeDeviceStepToContentMap}
            />
        </Screen>
    );
};
