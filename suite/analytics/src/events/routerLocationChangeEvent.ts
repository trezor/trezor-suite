import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    prevRouterUrl: AttributeDef<string>;
    nextRouterUrl: AttributeDef<string>;
    anchor?: AttributeDef<string>;
};

export const routerLocationChangeEvent: EventDef<Attributes, EventType.RouterLocationChange> = {
    name: EventType.RouterLocationChange,
    descriptionTrigger: 'User navigates to a different screen/URL within the application',
    changelog: [{ version: '1.3.0', notes: 'added' }],

    attributes: {
        prevRouterUrl: {
            changelog: [{ version: '1.3.0', notes: 'added' }],
            description: 'The URL/path of the previous screen the user was on before navigation',
        },
        nextRouterUrl: {
            changelog: [{ version: '1.3.0', notes: 'added' }],
            description: 'The URL/path of the new screen the user is navigating to',
        },
        anchor: {
            changelog: [{ version: '1.3.0', notes: 'added' }],
            description:
                'The anchor/hash fragment of the URL if present (e.g., `#settings` for deep-linking to a section)',
        },
    },
};
