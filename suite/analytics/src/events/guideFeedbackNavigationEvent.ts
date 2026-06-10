import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'overview' | 'bug' | 'suggestion'>;
};

export const guideFeedbackNavigationEvent: EventDef<Attributes, EventType.GuideFeedbackNavigation> =
    {
        name: EventType.GuideFeedbackNavigation,
        descriptionTrigger:
            'User navigates within the in-app Guide feedback area — the feedback overview hub, or the bug-report or feature-suggestion forms (see `type`).',
        changelog: [{ version: '1.11.0', notes: 'added' }],

        attributes: {
            type: {
                description:
                    'The feedback page type: `overview` for main feedback page, `bug` for bug report form, `suggestion` for feature suggestion form',
                changelog: [{ version: '1.11.0', notes: 'added' }],
            },
        },
    };
