import { EventType } from '../constants';
import { type AttributeDef, type EventDef } from '../eventDefinition';

type Attributes = {
    origin: AttributeDef<'postOnboardingDashboard'>;
    action: AttributeDef<'open' | 'close'>;
};

export const onboardingSurveyBannerEvent: EventDef<Attributes, EventType.OnboardingSurveyBanner> = {
    name: EventType.OnboardingSurveyBanner,
    descriptionTrigger:
        'A user opens the survey or dismisses the survey banner on the post-onboarding dashboard.',
    changelog: [{ version: '26.12.0', notes: 'added' }],
    attributes: {
        origin: {
            description: 'The post-onboarding dashboard where the banner was shown.',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
        action: {
            description: 'The user opened the survey or closed the banner.',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
    },
};
