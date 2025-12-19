import type { AttributeDef, EventDef } from '@suite-common/analytics';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<'tex' | 'ts7' | null>;
};

export const dashboardBanner: EventDef<Attributes, 'promo/dashboard-banner'> = {
    name: 'promo/dashboard-banner',
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
