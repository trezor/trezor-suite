import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type TradingType } from '@suite-common/trading';

import { EventType } from '../constants';

type TradingStatusValue =
    'waiting' | 'processing' | 'pending' | 'converting' | 'sending' | 'kyc' | 'success' | 'error';

type Attributes = {
    type: AttributeDef<TradingType>;
    status: AttributeDef<TradingStatusValue>;
};

export const tradingStatusEvent: EventDef<Attributes, EventType.TradingStatus> = {
    name: EventType.TradingStatus,
    descriptionTrigger: 'The status of an active trade changes to a new state',
    changelog: [{ version: '25.5.1', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'The type of trading transaction: `buy`, `sell`, or `exchange`',
        },
        status: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: `The current status:
- \`waiting\`: pending user action
- \`processing\`: being processed
- \`pending\`: awaiting confirmation
- \`converting\`: currency conversion in progress
- \`sending\`: funds being sent
- \`kyc\`: KYC verification required
- \`success\`: completed
- \`error\`: failed`,
        },
    },
};
