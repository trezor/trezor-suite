import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<string>;
    path: AttributeDef<string>;
    symbol: AttributeDef<string>;
};

export const accountsNewAccountEvent: EventDef<Attributes, EventType.AccountsNewAccount> = {
    name: EventType.AccountsNewAccount,
    descriptionTrigger: 'Accounts → `+` → Add new account of already activated coin',
    changelog: [
        { version: '1.0.0', notes: 'added' },
        {
            version: '1.19.0',
            notes: 'Renamed from `wallet/add-account` to `accounts/new-account`',
        },
    ],

    attributes: {
        symbol: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'btc, eth, etc, doge,...',
        },
        path: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'https://wiki.trezor.io/Standard_derivation_paths',
        },
        type: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'normal, segwit, legacy',
        },
    },
};
