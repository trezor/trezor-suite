import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'back' | 'close' | 'category'>;
    id?: AttributeDef<string>;
};

export const guideHeaderNavigationEvent: EventDef<Attributes, EventType.GuideHeaderNavigation> = {
    name: EventType.GuideHeaderNavigation,
    descriptionTrigger: 'User navigates using the header elements within the in-app Guide',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
            description:
                'Type of navigation action: `back` to go to previous page, `close` to exit guide, `category` to navigate to a category',
        },
        id: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
            description:
                'Identifier of the category or page being navigated to (optional, only present for `category` type)',
        },
    },
};
