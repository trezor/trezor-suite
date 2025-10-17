import { Screen } from '@suite-native/navigation';

import { OnboardingButtons } from '../components/OnboardingButtons';
import { TradingLocationSettings } from '../components/TradingLocationSettings';

export const TradingLocationModalScreen = () => (
    <Screen>
        <TradingLocationSettings context="onboarding">
            <OnboardingButtons />
        </TradingLocationSettings>
    </Screen>
);
