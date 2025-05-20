import { useSharedValue, withTiming } from 'react-native-reanimated';

import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    LoadingSuccessScreen,
    StackProps,
} from '@suite-native/navigation';

const NAVIGATION_TIMEOUT = 3000;

export const WalletCreatedSuccessScreen = ({
    navigation,
    route,
}: StackProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.WalletCreatedSuccess
>) => {
    const { flowType } = route.params;
    const textOpacity = useSharedValue(0);

    const handleFinish = () => {
        textOpacity.value = withTiming(1);
        setTimeout(() => {
            if (flowType === 'create') {
                navigation.navigate(DeviceOnboardingStackRoutes.WalletBackupRecap);
            } else {
                navigation.navigate(DeviceOnboardingStackRoutes.WalletRecoveryRecap);
            }
        }, NAVIGATION_TIMEOUT);
    };

    return (
        <LoadingSuccessScreen
            onFinish={handleFinish}
            title={
                <Translation id="moduleDeviceOnboarding.walletCreatedSuccessScreen.successLabel" />
            }
        />
    );
};
