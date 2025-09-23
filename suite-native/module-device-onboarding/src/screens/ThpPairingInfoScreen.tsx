import { ThpPairingInfoHelpButton, ThpPairingInfoScreenContent } from '@suite-native/thp';

import { NonClosableDeviceOnboardingScreen } from '../components/NonClosableDeviceOnboardingScreen';
import { useInitiateThpConnection } from '../hooks/useInitiateThpConnection';

export const ThpPairingInfoScreen = () => {
    const { initiateThpConnection } = useInitiateThpConnection();

    return (
        <NonClosableDeviceOnboardingScreen screenHeaderRightIcon={<ThpPairingInfoHelpButton />}>
            <ThpPairingInfoScreenContent onContinue={initiateThpConnection} />
        </NonClosableDeviceOnboardingScreen>
    );
};
