import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    prevRouterUrl: AttributeDef<string>;
    nextRouterUrl: AttributeDef<string>;
    anchor?: AttributeDef<string>;
};

export const routerLocationChangeEvent: EventDef<Attributes, EventType.RouterLocationChange> = {
    name: EventType.RouterLocationChange,
    descriptionTrigger: 'Fired on each url change (navigation in the app).',
    changelog: [{ version: '1.3.0', notes: 'added' }],

    attributes: {
        prevRouterUrl: {
            changelog: [{ version: '1.3.0', notes: 'added' }],
        },
        nextRouterUrl: {
            changelog: [{ version: '1.3.0', notes: 'added' }],
        },
        anchor: {
            changelog: [{ version: '1.3.0', notes: 'added' }],
        },
    },
};
