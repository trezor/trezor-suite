import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import {
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

export const useReceiveNavigation = () => {
    const { analytics } = useServices(injectNativeAnalytics);
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    const navigateToReceive = () => {
        analytics.report({
            type: events.receiveFlowEnteredEvent.name,
            payload: { location: 'dashboard' },
        });
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveCrossroads,
        });
    };

    return {
        isReceiveAvailable: !hasFirmwareAuthenticityCheckHardFailed,
        navigateToReceive,
    };
};
