import { type AccountType } from '@suite-common/wallet-config';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type TransactionCreatedEventAction =
    'sent' | 'copied' | 'downloaded' | 'replaced' | 'canceled';

export type TransactionCreatedEventTxType = 'trade-cex' | 'trade-dex' | 'stake' | 'yield';

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

    txType?: AttributeDef<TransactionCreatedEventTxType>;

    accountIndex?: AttributeDef<number>;
    accountType?: AttributeDef<AccountType>;
};

export const transactionCreatedEvent: EventDef<Attributes, EventType.TransactionCreated> = {
    name: EventType.TransactionCreated,
    descriptionTrigger:
        'When transaction is sent (Review & Send), replaced (Bump fee), copied (Broadcast option in send form is off), downloaded (Broadcast option in send form is off), or canceled (Cancelling TX and sending back to the users wallet). Mobile reports it only for trading, staking and yield transactions, when the send is confirmed; a plain mobile send reports `send/transaction_dispatched`',
    changelog: [
        { version: '1.9.0', notes: 'added' },
        { version: '25.4.0', notes: 'txType added' },
        {
            version: '26.10.0',
            notes: 'moved to suite-common and reported from mobile for staking and yield; txType gets `yield` and `stake` now also covers Tron and Cardano',
        },
        {
            version: '26.10.0',
            notes: 'reported from mobile for trading; txType `trade` split into `trade-cex` and `trade-dex`; accountIndex and accountType added for trading',
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
            description: 'tokens separated by `,`',
            changelog: [{ version: '1.9.0', notes: 'added' }],
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
            description: 'Whether the Bitcoin transaction includes a locktime/timelock parameter',
        },
        transactionData: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether the transaction includes additional data payload',
        },
        ethereumNonce: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether the transaction includes an Ethereum nonce field',
        },
        destinationTag: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
            description: 'Whether the transaction includes a destination tag',
        },
        selectedFee: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
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
                    version: '26.10.0',
                    notes: 'added `yield`; `stake` now also covers Tron and Cardano',
                },
                {
                    version: '26.10.0',
                    notes: '`trade` replaced by `trade-cex` and `trade-dex`; desktop DEX approve and revoke now report `trade-dex`',
                },
            ],
            description:
                '`trade-cex` for a sell or a swap with a CEX quote, `trade-dex` for every transaction of a swap with a DEX quote including its approve and revoke steps, `stake` for staking on any network, `yield` for every transaction of a yield flow including its approve, revoke, wrap and unwrap steps, so one yield or DEX action can emit several events',
        },
        accountIndex: {
            changelog: [{ version: '26.10.0', notes: 'added' }],
            description:
                '0-based index of the sending account within its network and account type; only for `trade-cex` and `trade-dex`',
        },
        accountType: {
            changelog: [{ version: '26.10.0', notes: 'added' }],
            description:
                'Type of the sending account, e.g. `normal`, `segwit`, `legacy`, `taproot`, `coinjoin`, `ledger`; only for `trade-cex` and `trade-dex`',
        },
    },
};
