import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'bug' | 'suggestion'>;
};

export const guideFeedbackSubmitEvent: EventDef<Attributes, EventType.GuideFeedbackSubmit> = {
    name: EventType.GuideFeedbackSubmit,
    descriptionTrigger: 'Guide > Report Bug & Feedback > Feedback > Submit',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
        },
    },
};
