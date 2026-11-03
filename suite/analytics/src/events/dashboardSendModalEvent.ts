import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DashboardSendModalEventSource = 'page-header' | 'asset-header';

type Attributes = {
    source: AttributeDef<DashboardSendModalEventSource>;
};

export const dashboardSendModalEvent: EventDef<Attributes, EventType.DashboardSendModal> = {
    name: EventType.DashboardSendModal,
    descriptionTrigger: 'User clicks on Send button from dashboard',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        source: {
            changelog: [
                { version: '26.3.0', notes: 'added' },
                { version: '26.11.0', notes: 'added `asset-header` value' },
                {
                    version: '26.11.0',
                    notes: '`page-header` is no longer reported, the dashboard header reports `navigate/flow` instead',
                },
            ],
            description:
                'Where the send modal was opened from: `page-header` from the main page header button (no longer reported), `asset-header` from the asset detail page header button',
        },
    },
};
