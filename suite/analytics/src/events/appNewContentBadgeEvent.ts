import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    badgeId: AttributeDef<string>;
    origin: AttributeDef<'nav'>;
};

export const appNewContentBadgeEvent: EventDef<Attributes, EventType.AppNewContentBadge> = {
    name: EventType.AppNewContentBadge,
    descriptionTrigger:
        'User clicks an element while its new-content badge or dot is visible, clearing that badge',
    changelog: [{ version: '26.8.0', notes: 'added' }],

    attributes: {
        badgeId: {
            description: 'The release-specific identifier of the new-content badge',
            changelog: [{ version: '26.8.0', notes: 'added' }],
        },
        origin: {
            description: 'The kind of element on which the badge was displayed',
            changelog: [{ version: '26.8.0', notes: 'added' }],
        },
    },
};
