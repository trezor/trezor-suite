import { type AttributeDef, type EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    analyticsPermission: AttributeDef<boolean>;
};

export const onboardingCompletedEvent: EventDef<Attributes, EventType.OnboardingCompleted> = {
    name: EventType.OnboardingCompleted,
    descriptionTrigger: 'The user leaves the last screen of onboarding.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        analyticsPermission: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Is analytics permission granted',
        },
    },
};
