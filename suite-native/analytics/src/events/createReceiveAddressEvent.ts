import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const createReceiveAddressEvent: EventDef<Attributes, EventType.CreateReceiveAddress> = {
    name: EventType.CreateReceiveAddress,
    descriptionTrigger: 'User generates a new receive address for a cryptocurrency account',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The blockchain network symbol for the account where the receive address is being created (e.g., `btc`, `eth`, `ada`)',
        },
    },
};
