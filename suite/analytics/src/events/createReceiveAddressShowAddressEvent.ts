import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    type: AttributeDef<'verified' | 'unverified'>;
};

export const createReceiveAddressShowAddressEvent: EventDef<
    Attributes,
    EventType.CreateReceiveAddressShowAddress
> = {
    name: EventType.CreateReceiveAddressShowAddress,
    descriptionTrigger:
        'User requests to show the full receiving address in the receive flow (Desktop)',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            description:
                'The blockchain network symbol for the receiving address (e.g., `btc`, `eth`)',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        type: {
            description: 'Whether the address is verified (checked against device) or unverified',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
