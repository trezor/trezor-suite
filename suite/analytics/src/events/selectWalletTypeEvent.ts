import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'hidden' | 'standard'>;
};

export const selectWalletTypeEvent: EventDef<Attributes, EventType.SelectWalletType> = {
    name: EventType.SelectWalletType,
    descriptionTrigger:
        'User selects a wallet type in the Select Wallet Type modal. Wallet type can be `standard` or `passphrase` (previously known as `hidden`). This modal only appears when passphrase protection is enabled on the device.',
    changelog: [{ version: '1.5.0', notes: 'added' }],

    attributes: {
        type: {
            description:
                'The wallet type selected: `standard` for normal wallet, `hidden` for passphrase-protected wallet',
            changelog: [{ version: '1.5.0', notes: 'added' }],
        },
    },
};
