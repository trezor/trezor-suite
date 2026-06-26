import { EventType } from '../constants';
import type { AnalyticsPlatform, AttributeDef, EventDef } from '../eventDefinition';

export type OnboardingFeedbackBannerOrigin = 'postOnboardingDashboard';
type OnboardingFeedbackBannerAction = 'cta' | 'close';

type Attributes = {
    platform: AttributeDef<AnalyticsPlatform>;
    origin: AttributeDef<OnboardingFeedbackBannerOrigin>;
    action: AttributeDef<OnboardingFeedbackBannerAction>;
};

export const onboardingFeedbackBannerClickedEvent: EventDef<
    Attributes,
    EventType.OnboardingFeedbackBannerClicked
> = {
    name: EventType.OnboardingFeedbackBannerClicked,
    descriptionTrigger:
        'Fired when the user interacts with the one-time onboarding feedback banner shown on the first post-onboarding dashboard — either by opening the survey (`cta`) or dismissing the banner (`close`). Emitted by both desktop and mobile app.',
    description:
        'Measures engagement with the post-onboarding feedback ask. The banner opens a survey about the setup experience; this event tracks how many freshly-onboarded users open it versus dismiss it.',
    changelog: [{ version: '26.7.1', notes: 'added' }],

    attributes: {
        platform: {
            changelog: [{ version: '26.7.1', notes: 'added' }],
            description: '`desktop` or `mobile`, identifying which app emitted the event.',
        },
        origin: {
            changelog: [{ version: '26.7.1', notes: 'added' }],
            description:
                'Where the banner was shown. Currently always `postOnboardingDashboard` (first dashboard after completing device onboarding).',
        },
        action: {
            changelog: [{ version: '26.7.1', notes: 'added' }],
            description:
                'What action was taken: `cta` (opened the feedback survey) or `close` (dismissed the banner).',
        },
    },
};
