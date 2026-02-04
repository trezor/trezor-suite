import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { AnalyticsSendFlowStep } from '../definitions';

type Attributes = {
    step: AttributeDef<AnalyticsSendFlowStep>;
};

export const sendFlowExitedEvent: EventDef<Attributes, EventType.SendFlowExited> = {
    name: EventType.SendFlowExited,
    descriptionTrigger:
        'Dispatched when user exits the send flow without successfully transmitting a transaction.',
    changelog: [{ version: '24.10.1', notes: 'Added' }],
    attributes: {
        step: {
            changelog: [{ version: '24.10.1', notes: 'added' }],
            description: 'Indicates from which step a user dropped from the send flow.',
        },
    },
};
