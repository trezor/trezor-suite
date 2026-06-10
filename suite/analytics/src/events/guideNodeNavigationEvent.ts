import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'page' | 'category'>;
    id: AttributeDef<string>;
};

export const guideNodeNavigationEvent: EventDef<Attributes, EventType.GuideNodeNavigation> = {
    name: EventType.GuideNodeNavigation,
    descriptionTrigger: 'User navigates to categories and articles within the in-app Guide',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
            description:
                'The type of navigation target: `page` for individual articles, `category` for guide categories',
        },
        id: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
            description: 'The identifier of the guide page or category being navigated to',
        },
    },
};
