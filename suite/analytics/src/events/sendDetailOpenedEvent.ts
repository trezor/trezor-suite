import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const sendDetailOpenedEvent: EventDef<Attributes, EventType.SendDetailOpened> = {
    name: EventType.SendDetailOpened,
    descriptionTrigger: 'Triggered when the transaction detail info screen is opened',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
