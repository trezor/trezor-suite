import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

export type TradingStatusStatus =
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
    status: AttributeDef<TradingStatusStatus>;
};

export const tradingStatusEvent: EventDef<Attributes, EventType.TradingStatus> = {
    name: EventType.TradingStatus,
    descriptionTrigger: 'Status of the trade changed - success included, after confirm_trade',
    changelog: [{ version: '25.5.1', notes: 'Added' }],
    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                '`buy`/`sell`/`exchange` - set via trade form; `settings` - set via settings (currently on iOS only); `onboarding` - set via initial app onboarding or after user updated the app',
        },
        status: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'When status of a trade updates we report this new status',
        },
    },
};
