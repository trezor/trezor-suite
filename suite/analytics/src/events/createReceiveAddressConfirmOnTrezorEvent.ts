import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const createReceiveAddressConfirmOnTrezorEvent: EventDef<
    Attributes,
    EventType.CreateReceiveAddressConfirmOnTrezor
> = {
    name: EventType.CreateReceiveAddressConfirmOnTrezor,
    descriptionTrigger: 'Desktop: Receive → Show full address → Confirm on Trezor',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
