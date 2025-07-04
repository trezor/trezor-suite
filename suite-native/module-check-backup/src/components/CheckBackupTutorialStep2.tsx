import { SharedValue } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';
import { DeviceModelInternal, models } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { CheckBackupTutorialStep } from './CheckBackupTutorialStep';

export type WalletBackupTutorialNumberedStepProps = {
    currentStepIndex: SharedValue<number>;
};

const continueButtonContainerStyle = prepareNativeStyle(() => ({
    width: '100%',
}));

type NavigationProps = StackNavigationProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes.CheckBackupTutorial
>;

const checkBackupUnsupportedDeviceModels: Array<DeviceModelInternal> = [DeviceModelInternal.T1B1];

export const CheckBackupTutorialStep2 = ({
    currentStepIndex,
}: WalletBackupTutorialNumberedStepProps) => {
    const navigation = useNavigation<NavigationProps>();
    const deviceModel = useSelector(selectDeviceModel);

    const { applyStyle } = useNativeStyles();
    const { showToast } = useToast();

    const navigateToCheckBackup = () => {
        if (deviceModel && checkBackupUnsupportedDeviceModels.includes(deviceModel)) {
            navigation.navigate(DeviceCheckBackupStackRoutes.UnsupportedModel, {
                deviceModel: models[deviceModel].name,
            });

            return;
        }
        navigation.navigate(DeviceCheckBackupStackRoutes.CheckBackup);
    };

    const navigateToSupportScreen = () => {
        //TODO: https://github.com/trezor/trezor-suite/issues/19841
        showToast({
            message: 'TODO: not implemented yet, handle redirect to support page',
            variant: 'warning',
        });
    };

    return (
        <CheckBackupTutorialStep
            stepId="checkBackupTutorialStep2"
            currentStepIndex={currentStepIndex}
            callout={<Translation id="moduleCheckBackup.checkBackupTutorialScreen.step2.callout" />}
            title={<Translation id="moduleCheckBackup.checkBackupTutorialScreen.step2.title" />}
            description={
                <Translation id="moduleCheckBackup.checkBackupTutorialScreen.step2.description" />
            }
            continueButton={
                <VStack spacing="sp12" style={applyStyle(continueButtonContainerStyle)}>
                    <Button
                        size="medium"
                        onPress={navigateToCheckBackup}
                        testID="@device-check-backup/continue-button"
                    >
                        <Translation id="moduleCheckBackup.checkBackupTutorialScreen.step2.checkButton" />
                    </Button>
                    <Button
                        size="medium"
                        colorScheme="tertiaryElevation0"
                        onPress={navigateToSupportScreen}
                    >
                        <Translation id="moduleCheckBackup.checkBackupTutorialScreen.step2.noBackupButton" />
                    </Button>
                </VStack>
            }
        />
    );
};
