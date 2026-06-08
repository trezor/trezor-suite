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
            description:
                'The step in the send flow where the user exited: `address_and_amount`, `address_review`, `outputs_review`, `utxo_selection`, or `destination_tag_review`',
        },
    },
};
