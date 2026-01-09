import { useCallback } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { EventType } from '@suite-native/analytics';
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
import { useLegacyAnalytics } from '@suite-native/services';
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
    const legacyAnalytics = useLegacyAnalytics();
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute();

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleCheckBackup.cancelAlert.title'),
            description: translate('moduleCheckBackup.cancelAlert.description'),
            primaryButtonTitle: translate('moduleCheckBackup.cancelAlert.primaryButton'),
            primaryButtonVariant: 'redBold',
            secondaryButtonTitle: translate('moduleCheckBackup.cancelAlert.secondaryButton'),
            secondaryButtonVariant: 'redElevation0',
            onPressPrimaryButton: () => {
                legacyAnalytics.report({
                    type: EventType.DeviceSettingsCheckBackupExited,
                    payload: {
                        location: route.name,
                    },
                });
                TrezorConnect.cancel();
                navigation.popTo(DeviceSettingsStackRoutes.DeviceBackupAndPassphrase);
            },
        });
    }, [showAlert, translate, legacyAnalytics, route.name, navigation]);

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
