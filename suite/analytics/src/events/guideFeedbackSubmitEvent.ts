import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'bug' | 'suggestion'>;
};

export const guideFeedbackSubmitEvent: EventDef<Attributes, EventType.GuideFeedbackSubmit> = {
    name: EventType.GuideFeedbackSubmit,
    descriptionTrigger:
        'User submits bug report or feature suggestion feedback through Guide > Report Bug & Feedback > Feedback > Submit',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {
        type: {
            description:
                'The feedback type: `bug` for bug report or `suggestion` for feature suggestion',
            changelog: [{ version: '1.11.0', notes: 'added' }],
        },
    },
};
