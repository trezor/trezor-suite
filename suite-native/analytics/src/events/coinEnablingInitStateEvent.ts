import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    enabledNetworks: AttributeDef<NetworkSymbol[]>;
};

export const coinEnablingInitStateEvent: EventDef<Attributes, EventType.CoinEnablingInitState> = {
    name: EventType.CoinEnablingInitState,
    descriptionTrigger:
        'On initial coin enabling setup when device is connected for the first time.',
    changelog: [{ version: '24.9.1', notes: 'Added' }],
    attributes: {
        enabledNetworks: { changelog: [{ version: '24.9.1', notes: 'added' }] },
    },
};
