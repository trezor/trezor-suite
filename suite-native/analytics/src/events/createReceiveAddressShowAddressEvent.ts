import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const createReceiveAddressShowAddressEvent: EventDef<
    Attributes,
    EventType.CreateReceiveAddressShowAddress
> = {
    name: EventType.CreateReceiveAddressShowAddress,
    descriptionTrigger: 'On Show address action.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Describes the network of the account',
        },
    },
};
