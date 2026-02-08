import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'exchange' | 'buy' | 'sell'>;
    status: AttributeDef<
        | 'converting'
        | 'sending'
        | 'success'
        | 'kyc'
        | 'error'
        | 'waiting'
        | 'processing'
        | 'pending'
    >;
};

export const tradeStatusEvent: EventDef<Attributes, EventType.TradeStatus> = {
    name: EventType.TradeStatus,
    descriptionTrigger: 'fired on final trading step when status changes',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        status: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
