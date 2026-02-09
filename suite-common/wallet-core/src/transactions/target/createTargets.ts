import { getInstantStakeType } from '@suite-common/staking';
import { Account, asTxOutputId } from '@suite-common/wallet-types';
import { InternalTransfer, Transaction } from '@trezor/blockchain-link-types';

import { InternalTarget, SimpleTarget, Target, TokenTarget } from './Target';

// Filter out internal transfers that are instant staking transactions
const filteredInternalTransfers = (
    internalTransfers: InternalTransfer[],
    account: Pick<Account, 'descriptor' | 'symbol'>,
) =>
    internalTransfers.filter(t => {
        const stakeType = getInstantStakeType(t, account.descriptor, account.symbol);

        return stakeType !== 'stake';
    });

type CreateCombineTargetsParams = {
    transaction: Pick<Transaction, 'targets' | 'tokens' | 'internalTransfers'>;
    account: Pick<Account, 'descriptor' | 'symbol'>;
};

/**
 * Join together regular targets, internal and token transfers
 */
export const createTargets = ({ transaction, account }: CreateCombineTargetsParams): Target[] => {
    const { targets, tokens, internalTransfers } = transaction;

    return [
        ...targets.map(
            (t): SimpleTarget => ({
                type: 'target' as const,
                targetId: asTxOutputId(`${t.n}`),
                payload: t,
            }),
        ),

        ...tokens
            .filter(token => token.type !== 'self')
            .map(
                (t): TokenTarget => ({
                    type: 'token' as const,
                    targetId: asTxOutputId(`token-${t.contract}`),
                    payload: t,
                }),
            ),

        ...filteredInternalTransfers(internalTransfers, account).map(
            (t): InternalTarget => ({
                type: 'internal' as const,
                targetId: asTxOutputId(`internal-${t.to}`),
                payload: t,
            }),
        ),
    ];
};
