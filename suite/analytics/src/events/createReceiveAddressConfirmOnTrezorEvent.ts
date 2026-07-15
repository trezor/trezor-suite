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
    descriptionTrigger:
        'User confirms a receiving address directly on their Trezor device in the Receive flow',
    changelog: [{ version: '25.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            description:
                'The blockchain network symbol for the receiving address being confirmed on device (e.g., `btc`, `eth`)',
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
