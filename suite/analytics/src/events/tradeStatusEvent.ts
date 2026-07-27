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
    descriptionTrigger:
        'During a trade transaction, the status of the trade changes (e.g., from `converting` to `sending` to `success` or error states)',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        type: {
            description:
                'The type of trade: `exchange` for token exchange, `buy` for buying cryptocurrency, `sell` for selling cryptocurrency',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        status: {
            description:
                'The current status of the trade: `converting` during conversion, `sending` when sending funds, `success` when completed, `kyc` for KYC required, `error` if failed, `waiting`/`processing`/`pending` for intermediate states',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
