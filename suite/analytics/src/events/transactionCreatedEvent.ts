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
            description: 'Account[`symbol`] e.g. `btc`, `eth`, `doge`',
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        tokens: {
            description: 'tokens separated by `,`',
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        outputsCount: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        broadcast: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        bitcoinLocktime: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        transactionData: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        ethereumNonce: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        destinationTag: {
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        selectedFee: {
            description: '`low`, `economy`, `normal`, `high`, `custom`',
            changelog: [{ version: '1.9.0', notes: 'added' }],
        },
        isCoinControlEnabled: {
            changelog: [{ version: '23.2.1', notes: 'added' }],
        },
        hasCoinControlBeenOpened: {
            changelog: [{ version: '23.2.1', notes: 'added' }],
        },
        txType: {
            description: '`stake` or `trade` whether the user is staking or trading',
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
