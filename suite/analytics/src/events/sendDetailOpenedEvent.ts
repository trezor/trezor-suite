import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const sendDetailOpenedEvent: EventDef<Attributes, EventType.SendDetailOpened> = {
    name: EventType.SendDetailOpened,
    descriptionTrigger: 'User opens the detail information screen for a send transaction',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.5.0', notes: 'added' }],
            description:
                'The blockchain network symbol or token symbol being sent (e.g., `btc`, `eth`)',
        },
    },
};
