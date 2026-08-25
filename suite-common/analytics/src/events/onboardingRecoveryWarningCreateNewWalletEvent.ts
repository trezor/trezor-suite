import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    platform: AttributeDef<AnalyticsPlatform>;
};

export const onboardingRecoveryWarningCreateNewWalletEvent: EventDef<
    Attributes,
    EventType.OnboardingRecoveryWarningCreateNewWallet
> = {
    name: EventType.OnboardingRecoveryWarningCreateNewWallet,
    descriptionTrigger:
        'User clicks Create a new wallet in the onboarding recovery source warning. Emitted by both desktop and mobile app.',
    changelog: [
        { version: '26.8.0', notes: 'added' },
        { version: '26.9.0', notes: 'no longer called anywhere' },
    ],

    attributes: {
        platform: {
            description: '`desktop` or `mobile`, identifying which app emitted the event.',
            changelog: [{ version: '26.8.0', notes: 'added' }],
        },
    },
};
