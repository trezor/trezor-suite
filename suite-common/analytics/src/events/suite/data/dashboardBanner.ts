import type { AttributeDef, EventDef } from '../../analyticsSchema';
import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'cta' | 'close'>;
    bannerType?: AttributeDef<string | null>;
};

export const dashboardBanner: EventDef<EventType.DashboardBanner, Attributes> = {
    name: EventType.DashboardBanner,
    descriptionTrigger: 'A user clicks the dashboard promo banner',
    addedInVersion: '25.8.0',
    changelog: '',
    lastUpdatedInVersion: '25.8.0',

    attributes: {
        action: {
            addedInVersion: '25.8.0',
            changelog: '',
        },
        bannerType: {
            limitations: 'only selected strings allowed (e.g. `tex` and `ts7`)',
            addedInVersion: '25.8.0',
            changelog: '',
        },
    },
};
