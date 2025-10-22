import { Screen, ScreenHeader } from '@suite-native/navigation';
import { OnboardingButtons, TradingLocationSettings } from '@suite-native/trading-residence';

import { useExitOnboardingFlow } from '../hooks/useExitOnboardingFlow';

export const TradingLocationScreen = () => {
    const exitOnboardingFlow = useExitOnboardingFlow();

    return (
        <Screen header={<ScreenHeader />}>
            <TradingLocationSettings context="onboarding">
                <OnboardingButtons afterPress={exitOnboardingFlow} />
            </TradingLocationSettings>
        </Screen>
    );
};
