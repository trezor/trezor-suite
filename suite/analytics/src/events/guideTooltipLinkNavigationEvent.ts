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
    descriptionTrigger: 'Learn button in tooltip. E.g. in Send raw transaction',
    changelog: [{ version: '1.12.0', notes: 'added' }],

    attributes: {
        id: {
            changelog: [{ version: '1.12.0', notes: 'added' }],
        },
    },
};
