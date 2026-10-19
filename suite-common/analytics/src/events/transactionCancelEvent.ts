import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    txType?: AttributeDef<'trade' | 'stake' | 'yield'>;
    stage?: AttributeDef<'signing' | 'review'>;
    networkSymbol: AttributeDef<string>;
};

export const transactionCancelEvent: EventDef<Attributes, EventType.TransactionCancel> = {
    name: EventType.TransactionCancel,
    descriptionTrigger:
        'User intentionally cancels transaction signing or declines the signed transaction review before broadcast. Device, PIN and application cancellations share this event; unrelated signing failures and timeouts do not. Mobile currently reports Earn signing cancellation only',
    changelog: [
        { version: '25.4.0', notes: 'added' },
        {
            version: '26.11.0',
            notes: 'Shared with mobile Earn; added yield and cancellation stage; desktop Earn approvals and revokes using shared Send are included; only explicit user cancellations are counted',
        },
    ],

    attributes: {
        stage: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                '`signing` for a cancelled Connect signing request, `review` for declining a signed transaction before broadcast. Does not identify device versus application origin',
        },
        txType: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'Type of transaction being cancelled: `trade` for trading transactions, `stake` for staking transactions, `yield` for yield transactions including approve, revoke, wrap and unwrap',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The blockchain network symbol of the transaction being cancelled (e.g., `btc`, `eth`)',
        },
    },
};
