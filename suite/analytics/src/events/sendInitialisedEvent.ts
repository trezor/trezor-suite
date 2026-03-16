import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const sendInitialisedEvent: EventDef<Attributes, EventType.SendInitialised> = {
    name: EventType.SendInitialised,
    descriptionTrigger: 'Triggered when the transaction is initialised',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
