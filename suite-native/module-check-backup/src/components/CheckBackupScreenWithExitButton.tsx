import { useCallback } from 'react';

import { useNavigation, useRoute } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { useAlert } from '@suite-native/alerts';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useTranslate } from '@suite-native/intl';
import {
    BACK_NAVIGATION_ACTIONS,
    type DeviceCheckBackupStackParamList,
    type DeviceCheckBackupStackRoutes,
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    Screen,
    ScreenHeader,
    type ScreenProps,
    type StackToStackCompositeNavigationProps,
    useNavigationRemoveGuard,
} from '@suite-native/navigation';
import TrezorConnect from '@trezor/connect';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceCheckBackupStackParamList,
    DeviceCheckBackupStackRoutes,
    DeviceSettingsStackParamList
>;

export const useHandleCheckBackupExitButtonPress = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const { analytics } = useServices(injectNativeAnalytics);
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute();

    const handleExitButtonPress = useCallback(() => {
        showAlert({
            title: translate('moduleCheckBackup.cancelAlert.title'),
            description: translate('moduleCheckBackup.cancelAlert.description'),
            primaryButtonTitle: translate('moduleCheckBackup.cancelAlert.primaryButton'),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            secondaryButtonTitle: translate('moduleCheckBackup.cancelAlert.secondaryButton'),
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressPrimaryButton: () => {
                analytics.report({
                    type: events.deviceSettingsCheckBackupExitedEvent.name,
                    payload: {
                        location: route.name,
                    },
                });
                TrezorConnect.cancel();
                navigation.popTo(DeviceSettingsStackRoutes.DeviceBackupAndPassphrase);
            },
        });
    }, [showAlert, translate, analytics, route.name, navigation]);

    return handleExitButtonPress;
};

export const CheckBackupScreenWithExitButton = ({ children, ...screenProps }: ScreenProps) => {
    const handleExitButtonPress = useHandleCheckBackupExitButtonPress();

    useNavigationRemoveGuard({
        actionTypes: BACK_NAVIGATION_ACTIONS,
        onBlocked: handleExitButtonPress,
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
