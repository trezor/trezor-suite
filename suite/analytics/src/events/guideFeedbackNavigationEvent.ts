import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'overview' | 'bug' | 'suggestion'>;
};

export const guideFeedbackNavigationEvent: EventDef<Attributes, EventType.GuideFeedbackNavigation> =
    {
        name: EventType.GuideFeedbackNavigation,
        descriptionTrigger: 'Guide > Report Bug & Feedback',
        changelog: [{ version: '1.11.0', notes: 'added' }],

        attributes: {
            type: {
                changelog: [{ version: '1.11.0', notes: 'added' }],
            },
        },
    };
