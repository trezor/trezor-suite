import { Screen, ScreenHeader } from '@suite-native/navigation';

import { OnboardingButtons } from '../components/OnboardingButtons';
import { TradingLocationSettings } from '../components/TradingLocationSettings';

export const TradingLocationOnboardingScreen = () => (
    <Screen header={<ScreenHeader />}>
        <TradingLocationSettings context="onboarding">
            <OnboardingButtons />
        </TradingLocationSettings>
    </Screen>
);
