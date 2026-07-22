import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    enabledNetworks: AttributeDef<NetworkSymbol[]>;
};

export const coinEnablingInitStateEvent: EventDef<Attributes, EventType.CoinEnablingInitState> = {
    name: EventType.CoinEnablingInitState,
    descriptionTrigger:
        'Blockchain networks are being enabled during initial setup when a device is connected for the first time',
    changelog: [{ version: '24.9.1', notes: 'added' }],
    attributes: {
        enabledNetworks: {
            description:
                'List of blockchain network symbols that are enabled during initial setup (e.g., `btc`, `eth`, `ada`)',
            changelog: [{ version: '24.9.1', notes: 'added' }],
        },
    },
};
