import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const sendInitialisedEvent: EventDef<Attributes, EventType.SendInitialised> = {
    name: EventType.SendInitialised,
    descriptionTrigger:
        'User initiates a transaction in the send flow by filling in initial transaction details',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        assetSymbol: {
            description:
                'The blockchain network symbol for the transaction being sent (e.g., `btc`, `eth`)',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
