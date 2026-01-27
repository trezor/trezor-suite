import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<string | null>;
};

export const promoDashboardBannerEvent: EventDef<Attributes, EventType.PromoDashboardBanner> = {
    name: EventType.PromoDashboardBanner,
    descriptionTrigger: 'A user clicks the dashboard promo banner',
    changelog: [{ version: '25.8.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
        bannerType: {
            limitations: 'only selected strings allowed (e.g. `tex` and `ts7`)',
            changelog: [{ version: '25.8.0', notes: 'added' }],
        },
    },
};
