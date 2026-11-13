import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'hidden' | 'standard'>;
};

export const createWalletTypeEvent: EventDef<Attributes, EventType.CreateWalletType> = {
    name: EventType.CreateWalletType,
    descriptionTrigger:
        'A wallet is created: `standard` for the empty-passphrase wallet, `hidden` for a passphrase wallet.',
    changelog: [
        { version: '1.5.0', notes: 'added as select-wallet-type' },
        {
            version: '26.12.0',
            notes: 'reported for every wallet authorized on a device, including its first one',
        },
    ],

    attributes: {
        type: {
            description:
                'The wallet type selected: `standard` for normal wallet, `hidden` for passphrase-protected wallet',
            changelog: [{ version: '1.5.0', notes: 'added' }],
        },
    },
};
