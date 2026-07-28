import type { Route } from '@suite/router';
import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type RouteName = Route['name'];

type Attributes = {
    from: AttributeDef<RouteName | 'unknown'>;
};

export const yieldEarnEntryEvent: EventDef<Attributes, EventType.YieldEarnEntry> = {
    name: EventType.YieldEarnEntry,
    descriptionTrigger:
        'fired when the user lands on the earn dashboard (the `suite-earn` route), once per location change',
    changelog: [{ version: '26.5.2', notes: 'added' }],

    attributes: {
        from: {
            description:
                'Previous route name (e.g. `suite-index`, `earn-yield-deposit`, `wallet-tokens-defi`). `unknown` if the user landed via initial load / direct route / refresh.',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
    },
};
