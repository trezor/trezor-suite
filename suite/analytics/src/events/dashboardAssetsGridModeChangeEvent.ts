import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    layout: AttributeDef<'grid' | 'table'>;
};

export const dashboardAssetsGridModeChangeEvent: EventDef<
    Attributes,
    EventType.DashboardAssetsGridModeChange
> = {
    name: EventType.DashboardAssetsGridModeChange,
    descriptionTrigger:
        'Fired on every change on the asset mode button displayed on the dashboard view.',
    changelog: [{ version: '26.1.2', notes: 'added' }],

    attributes: {
        layout: {
            changelog: [{ version: '26.1.2', notes: 'added' }],
        },
    },
};
