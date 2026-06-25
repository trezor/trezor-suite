import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    platform: AttributeDef<'mobile' | 'desktop'>;
};

export const onboardingFeedbackBannerEvent: EventDef<
    Attributes,
    EventType.OnboardingFeedbackBanner
> = {
    name: EventType.OnboardingFeedbackBanner,
    descriptionTrigger:
        'User interacts with the one-time onboarding feedback banner on the first post-onboarding dashboard',
    changelog: [{ version: '26.7.0', notes: 'added' }],

    attributes: {
        action: {
            description:
                'The user action: `cta` when opening the feedback survey, `close` when dismissing the banner',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        platform: {
            description: 'The platform the banner was shown on: `desktop` or `mobile`',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
    },
};
