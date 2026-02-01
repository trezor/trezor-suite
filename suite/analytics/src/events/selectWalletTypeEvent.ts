import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'hidden' | 'standard'>;
};

export const selectWalletTypeEvent: EventDef<Attributes, EventType.SelectWalletType> = {
    name: EventType.SelectWalletType,
    descriptionTrigger:
        'Fired when "Standard" or "Hidden" wallet is selected in the "Select wallet type" modal. "Passphrase" has to be enabled on the device to see this modal.',
    changelog: [{ version: '1.5.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '1.5.0', notes: 'added' }],
        },
    },
};
