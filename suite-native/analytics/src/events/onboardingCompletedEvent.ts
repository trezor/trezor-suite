import { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    analyticsPermission: AttributeDef<boolean>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
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
