import { type AttributeDef, type EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    analyticsPermission: AttributeDef<boolean>;
};

export const onboardingCompletedEvent: EventDef<Attributes, EventType.OnboardingCompleted> = {
    name: EventType.OnboardingCompleted,
    descriptionTrigger: 'User completes the onboarding flow and exits the last screen',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        analyticsPermission: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'Whether the user granted permission for analytics tracking (`true`) or denied it (`false`)',
        },
    },
};
