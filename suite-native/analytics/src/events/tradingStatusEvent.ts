import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type TradingStatusValue =
    | 'waiting'
    | 'processing'
    | 'pending'
    | 'converting'
    | 'sending'
    | 'kyc'
    | 'success'
    | 'error';

type Attributes = {
    type: AttributeDef<TradingType>;
    status: AttributeDef<TradingStatusValue>;
};

export const tradingStatusEvent: EventDef<Attributes, EventType.TradingStatus> = {
    name: EventType.TradingStatus,
    descriptionTrigger: 'Status of the trade changes',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Type of trade',
        },
        status: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
        },
    },
};
