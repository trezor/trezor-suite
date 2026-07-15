import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type TransactionCreatedEventAction =
    | 'sent'
    | 'copied'
    | 'downloaded'
    | 'replaced'
    | 'canceled';

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

    txType?: AttributeDef<'trade' | 'stake'>;
};

export const transactionCreatedEvent: EventDef<Attributes, EventType.TransactionCreated> = {
    name: EventType.TransactionCreated,
    descriptionTrigger:
        'When transaction is sent (Review & Send), replaced (Bump fee), copied (Broadcast option in send form is off), downloaded (Broadcast option in send form is off), or canceled (Cancelling TX and sending back to the users wallet)',
    changelog: [
        { version: '1.9.0', notes: 'added' },
        { version: '25.4.0', notes: 'txType added' },
    ],
    possibleImprovements: 'rename to `accounts/transaction-created`',

    attributes: {
        action: {
            description: '`sent`, `copied`, `downloaded`, `replaced`, `canceled`',
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
                'Whether the transaction is broadcast directly to the network (`true`) or saved for later broadcast (`false`)',
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
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The type of transaction: `trade` for trading flows, `stake` for staking-related transactions',
        },
    },
};
