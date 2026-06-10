import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<string | null>;
};

export const promoDashboardBannerEvent: EventDef<Attributes, EventType.PromoDashboardBanner> = {
    name: EventType.PromoDashboardBanner,
    descriptionTrigger: 'User interacts with a promotional banner on the dashboard',
    changelog: [{ version: '25.8.0', notes: 'added' }],

    attributes: {
        action: {
            description:
                'The user action: `cta` when clicking the call-to-action link, `close` when dismissing the banner',
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
        bannerType: {
            description: 'Type or identifier of the promotional banner (e.g., `tex`, `ts7`)',
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
    },
};
