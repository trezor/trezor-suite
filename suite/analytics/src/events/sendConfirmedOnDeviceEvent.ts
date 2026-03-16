import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
};

export const sendConfirmedOnDeviceEvent: EventDef<Attributes, EventType.SendConfirmedOnDevice> = {
    name: EventType.SendConfirmedOnDevice,
    descriptionTrigger: 'Triggered when the user confirms the transaction on their device',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.4.1', notes: 'added' }],
        },
    },
};
