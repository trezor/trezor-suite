import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<string>;
    path: AttributeDef<string>;
    symbol: AttributeDef<string>;
};

export const accountsNewAccountEvent: EventDef<Attributes, EventType.AccountsNewAccount> = {
    name: EventType.AccountsNewAccount,
    descriptionTrigger:
        'User creates a new account for an already activated coin via Accounts menu > + button > Add new account',
    changelog: [
        { version: '1.0.0', notes: 'added' },
        {
            version: '1.19.0',
            notes: 'Renamed from `wallet/add-account` to `accounts/new-account`',
        },
    ],

    attributes: {
        symbol: {
            description:
                'The blockchain network symbol: `btc` for Bitcoin, `eth` for Ethereum, etc.',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        path: {
            description:
                'The derivation path used for the account (see [Standard derivation paths](https://wiki.trezor.io/Standard_derivation_paths))',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        type: {
            description:
                'The account type, one of: `normal`, `imported`, `placeholder`, `legacy`, `segwit`, `coinjoin`, `taproot`, `ledger`',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
