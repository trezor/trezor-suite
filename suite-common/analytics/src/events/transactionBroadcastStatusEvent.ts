import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

// TODO: Extend this union to send and trading when those flows report transaction/broadcast-status.
export type TransactionBroadcastStatusFlow =
    | 'stake'
    | 'unstake'
    | 'claim'
    | 'withdraw'
    | 'vote'
    | 'yield-deposit'
    | 'yield-withdraw'
    | 'yield-redeem'
    | 'merkl-claim'
    | 'approve'
    | 'revoke'
    | 'wrap'
    | 'unwrap';

type Attributes = {
    stage: AttributeDef<'broadcast' | 'confirmation'>;
    status: AttributeDef<'success' | 'error'>;
    networkSymbol: AttributeDef<string>;
    flow: AttributeDef<TransactionBroadcastStatusFlow>;
    isCancellation: AttributeDef<boolean>;
    isRbf: AttributeDef<boolean>;
};

export const transactionBroadcastStatusEvent: EventDef<
    Attributes,
    EventType.TransactionBroadcastStatus
> = {
    name: EventType.TransactionBroadcastStatus,
    descriptionTrigger:
        'Outcome of a staking or yield transaction: signed transaction submission success/error, then confirmation/failure observed in account history. Broadcast success does not imply confirmation. Each submission attempt, including a fee bump, reports its own broadcast outcome; fee bumps keep the original flow and track the replacement for confirmation. Pending transactions do not emit a confirmation outcome. Signing/review cancellations use transaction/cancel; on-chain cancellation replacements keep the original flow and set isCancellation=true. Tracking lasts for the current app session.',
    changelog: [{ version: '26.11.0', notes: 'added for Desktop and Mobile Earn' }],
    attributes: {
        stage: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'broadcast = submitting the signed transaction succeeded or failed; confirmation = the backend reported a mined transaction in account history',
        },
        status: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'success or error at the reported stage; no specific error details are included',
        },
        networkSymbol: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'Blockchain network symbol, e.g. eth, sol, ada or trx',
        },
        isCancellation: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'True for an on-chain cancellation replacement. Its success means cancellation succeeded, not that the original Earn operation completed. Signing/review cancellations use transaction/cancel.',
        },
        isRbf: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'True for a replacement transaction, including fee bumps and on-chain cancellations. A speedup has isRbf=true and isCancellation=false. Preserved for broadcast and confirmation outcomes.',
        },
        flow: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description:
                'Staking operation or yield step. Approvals, revokes, wraps and unwraps use generic operation names; merkl-claim identifies Merkl reward claims. Withdraw and redeem retain their distinct yield flow types.',
        },
    },
};
