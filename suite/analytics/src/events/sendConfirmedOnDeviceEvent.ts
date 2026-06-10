import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const sendConfirmedOnDeviceEvent: EventDef<Attributes, EventType.SendConfirmedOnDevice> = {
    name: EventType.SendConfirmedOnDevice,
    descriptionTrigger:
        'User confirms the pending transaction directly on their Trezor device screen',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        assetSymbol: {
            description:
                'The blockchain network symbol for the transaction being confirmed (e.g., `btc`, `eth`)',
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
