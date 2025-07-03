import { ThpPairingInfoHelpButton, ThpPairingInfoScreenContent } from '@suite-native/thp';

import { DeviceOnboardingScreenWithExitButton } from '../components/DeviceOnboardingScreenWithExitButton';
import { useInitiateThpConnection } from '../hooks/useInitiateThpConnection';

export const ThpPairingInfoScreen = () => {
    const { initiateThpConnection } = useInitiateThpConnection();

    return (
        <DeviceOnboardingScreenWithExitButton screenHeaderRightIcon={<ThpPairingInfoHelpButton />}>
            <ThpPairingInfoScreenContent onContinue={initiateThpConnection} />
        </DeviceOnboardingScreenWithExitButton>
    );
};
