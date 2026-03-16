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
    descriptionTrigger: 'Desktop: Receive → Show full address',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
        type: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
