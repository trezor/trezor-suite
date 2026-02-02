import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

export type TradingStatusEventStatus =
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
    status: AttributeDef<TradingStatusEventStatus>;
};

export const tradingStatusEvent: EventDef<Attributes, EventType.TradingStatus> = {
    name: EventType.TradingStatus,
    descriptionTrigger: 'Trading flow status change (waiting, processing, success, error, etc.).',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        type: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        status: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
