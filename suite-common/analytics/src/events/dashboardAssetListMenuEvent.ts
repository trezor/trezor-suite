import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    type: AttributeDef<'grouping' | 'show-small-balances'>;
    value: AttributeDef<'default' | 'by-networks' | boolean>;
};

export const dashboardAssetListMenuEvent: EventDef<Attributes, EventType.DashboardAssetListMenu> = {
    name: EventType.DashboardAssetListMenu,
    descriptionTrigger: 'User changes an option in the Home asset table filter menu',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'The changed option: `grouping` for the row grouping, `show-small-balances` for the small balances switch',
        },
        value: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'The new value: `default` or `by-networks` for `grouping`, `true` or `false` for `show-small-balances`',
        },
    },
};
