import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<'show-more' | 'show-less'>;
};

export const dashboardAssetTableEvent: EventDef<Attributes, EventType.DashboardAssetTable> = {
    name: EventType.DashboardAssetTable,
    descriptionTrigger: 'User clicks Show more or Show less under the Home asset table',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: '`show-more` when the table unfolds, `show-less` when it folds back',
        },
    },
};
