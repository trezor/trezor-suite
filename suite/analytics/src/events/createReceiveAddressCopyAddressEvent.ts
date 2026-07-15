import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const createReceiveAddressCopyAddressEvent: EventDef<
    Attributes,
    EventType.CreateReceiveAddressCopyAddress
> = {
    name: EventType.CreateReceiveAddressCopyAddress,
    descriptionTrigger:
        'User copies a full receiving address to clipboard in the Receive flow (Desktop)',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            description:
                'The blockchain network symbol for the receiving address being copied (e.g., `btc`, `eth`)',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
