import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    id: AttributeDef<string>;
};

export const guideTooltipLinkNavigationEvent: EventDef<
    Attributes,
    EventType.GuideTooltipLinkNavigation
> = {
    name: EventType.GuideTooltipLinkNavigation,
    descriptionTrigger:
        'User clicks on a `Learn` button within a context tooltip to access in-app guide information (e.g., in Send raw transaction form)',
    changelog: [{ version: '1.12.0', notes: 'added' }],

    attributes: {
        id: {
            description: 'Identifier of the guide topic or tooltip being accessed',
            changelog: [{ version: '1.12.0', notes: 'added' }],
        },
    },
};
