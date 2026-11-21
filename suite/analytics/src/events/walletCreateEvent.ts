import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'hidden' | 'standard'>;
};

export const walletCreateEvent: EventDef<Attributes, EventType.WalletCreate> = {
    name: EventType.WalletCreate,
    descriptionTrigger:
        'A wallet is created: `standard` for the empty-passphrase wallet, `hidden` for a passphrase wallet.',
    changelog: [
        { version: '1.5.0', notes: 'added as `select-wallet-type`' },
        {
            version: '25.7.0',
            notes: '`select-wallet-type` broken. not reported correctly for standard wallets',
        },
        {
            version: '26.12.0',
            notes: 'fixed. renamed to `wallet-create`. reported for every wallet authorized on a device, including its first one',
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
