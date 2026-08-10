import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type FeedbackCategory } from '@suite-common/feedback';

import { EventType } from '../constants';

type Attributes = {
    category: AttributeDef<FeedbackCategory>;
    context: AttributeDef<string | undefined>;
};

export const feedbackSentEvent: EventDef<Attributes, EventType.FeedbackSent> = {
    name: EventType.FeedbackSent,
    descriptionTrigger: 'User submits a feedback card',
    changelog: [{ version: '26.8.1', notes: 'added' }],

    attributes: {
        category: {
            description: 'Where the feedback card is shown, e.g. `trade`, `yield`',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
        context: {
            description:
                'Optional label for the feedback context; for trade feedback the trade type `buy`, `sell`, or `exchange`',
            changelog: [{ version: '26.8.1', notes: 'added' }],
        },
    },
};
