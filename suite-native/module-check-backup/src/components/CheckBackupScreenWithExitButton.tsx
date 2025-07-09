import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import {
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    Screen,
    ScreenHeader,
    ScreenProps,
    StackToStackCompositeNavigationProps,
    useOverrideBackNavigation,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type DeviceOnboardingExitButtonScreenHeaderProps = {
    onAlertContinueButtonPress?: () => void;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    DeviceSettingsStackParamList
>;

export const useHandleCheckBackupExitButtonPress = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProps>();

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleCheckBackup.cancelAlert.title'),
            description: translate('moduleCheckBackup.cancelAlert.description'),
            primaryButtonTitle: translate('moduleCheckBackup.cancelAlert.primaryButton'),
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: translate('moduleCheckBackup.cancelAlert.secondaryButton'),
            secondaryButtonVariant: 'redElevation0',
            onPressPrimaryButton: () => {
                TrezorConnect.cancel();
                navigation.navigate(DeviceSettingsStackRoutes.DeviceSettings);
            },
        });
    }, [navigation, showAlert, translate]);

    return handleExitButtonPress;
};

export const CheckBackupScreenWithExitButton = ({
    children,
    onAlertContinueButtonPress,
    ...screenProps
}: ScreenProps & DeviceOnboardingExitButtonScreenHeaderProps) => {
    const handleExitButtonPress = useHandleCheckBackupExitButtonPress();

    useOverrideBackNavigation({
        onNavigateBack: handleExitButtonPress,
    });

    return (
        <Screen
            header={<ScreenHeader closeActionType="close" closeAction={handleExitButtonPress} />}
            {...screenProps}
        >
            {children}
        </Screen>
    );
};
