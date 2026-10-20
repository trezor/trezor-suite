import { type AccountType } from '@suite-common/wallet-config';
import { type FormStateTxType } from '@suite-common/wallet-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type TransactionCreatedEventAction =
    'sent' | 'copied' | 'downloaded' | 'replaced' | 'canceled';

type Attributes = {
    action: AttributeDef<TransactionCreatedEventAction>;

    symbol: AttributeDef<string>;
    tokens: AttributeDef<string>;
    outputsCount: AttributeDef<number>;

    broadcast: AttributeDef<boolean>;

    bitcoinLocktime: AttributeDef<boolean>;

    transactionData: AttributeDef<boolean>;
    ethereumNonce: AttributeDef<boolean>;
    destinationTag: AttributeDef<boolean>;

    selectedFee: AttributeDef<string>;

    isCoinControlEnabled: AttributeDef<boolean>;
    hasCoinControlBeenOpened: AttributeDef<boolean>;

    txType?: AttributeDef<FormStateTxType>;

    accountIndex?: AttributeDef<number>;
    accountType?: AttributeDef<AccountType>;
};

export const transactionCreatedEvent: EventDef<Attributes, EventType.TransactionCreated> = {
    name: EventType.TransactionCreated,
    descriptionTrigger:
        'When transaction is sent (Review & Send), replaced (Bump fee), copied (Broadcast option in send form is off), downloaded (Broadcast option in send form is off), or canceled (Cancelling TX and sending back to the users wallet). Mobile reports it for staking, yield and send transactions, when the send is confirmed; a plain mobile send additionally reports `send/transaction_dispatched`',
    changelog: [
        { version: '1.9.0', notes: 'added' },
        { version: '25.4.0', notes: 'txType added' },
        {
            version: '26.11.0',
            notes: 'moved to suite-common and reported from mobile for staking, yield and send with transaction options from the signing form; txType gets `yield` and `send`, `stake` now also covers Tron and Cardano; accountIndex and accountType added for send',
        },
    ],
    possibleImprovements: 'rename to `accounts/transaction-created`',

    attributes: {
        action: {
            description:
                '`sent`, `copied`, `downloaded`, `replaced`, `canceled`; mobile only `sent`',
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        symbol: {
            description: 'Network symbol e.g. `btc`, `eth`',
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        tokens: {
            description:
                'Token symbols separated by `,`. Yield reports the token from the prepared transaction on both platforms, independently of device review screens; empty when the transaction has no token.',
            changelog: [
                { version: '1.9.0', notes: 'added' },
                { version: '26.11.0', notes: 'Aligned yield token symbols on mobile and desktop.' },
            ],
        },
        outputsCount: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Number of transaction outputs (recipients)',
        },
        broadcast: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description:
                'Whether the transaction is broadcast directly to the network. `false` only for a desktop send with the broadcast option off (`action` is then `copied` or `downloaded`); staking, yield and every mobile transaction are always `true`',
        },
        bitcoinLocktime: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether the Bitcoin locktime option is enabled in the signing form',
        },
        transactionData: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description:
                'Whether the transaction-data option is enabled in the signing form (including contract calls for mobile Earn)',
        },
        ethereumNonce: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description:
                'Whether the custom Ethereum nonce option is enabled in the signing form; an automatically assigned nonce does not set this flag',
        },
        destinationTag: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether the destination-tag option is enabled in the signing form',
        },
        selectedFee: {
            changelog: [
                { version: '1.9.0', notes: 'added' },
                {
                    version: '26.11.0',
                    notes: 'Desktop yield preserves the fee level selected in simulation instead of always reporting custom.',
                },
            ],
            description:
                'The selected fee level for the transaction (e.g., `custom`, `normal`, `economy`, `high`, `low`)',
        },
        isCoinControlEnabled: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether coin control feature is enabled in wallet settings',
        },
        hasCoinControlBeenOpened: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether the user opened coin control interface during this transaction',
        },
        txType: {
            changelog: [
                { version: '25.4.0', notes: 'added' },
                {
                    version: '26.11.0',
                    notes: 'added `yield` and `send`; `stake` now also covers Tron and Cardano',
                },
            ],
            description:
                '`send` for a transaction from the send form including bump fee and cancel, `trade` for trading, `stake` for staking on any network, `yield` for every transaction of a yield flow including its approve, revoke, wrap and unwrap steps, so one yield action can emit several events. Undefined for a trading allowance approve or revoke',
        },
        accountIndex: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'The 0-based account index within its network and account type, the same as `index` in `accounts/info`; only when `txType` is `send`',
        },
        accountType: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'The account type (`normal`, `segwit`, `legacy`, `taproot`, `coinjoin`, `ledger`), the same as in `accounts/info`; only when `txType` is `send`',
        },
    },
};
