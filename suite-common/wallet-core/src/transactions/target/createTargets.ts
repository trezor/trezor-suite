import { getInstantStakeType } from '@suite-common/staking';
import { type Account, type TxTargetId, asTxTargetId } from '@suite-common/wallet-types';
import {
    type Target as BlockchainlinkTarget,
    type InternalTransfer,
    type TokenTransfer,
    type Transaction,
} from '@trezor/blockchain-link-types';

import { type InternalTarget, type SimpleTarget, type Target, type TokenTarget } from './Target';

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

export const createSimpleTargetId = (t: Pick<BlockchainlinkTarget, 'n'>): TxTargetId =>
    asTxTargetId(`${t.n}`);

export const createSimpleTarget = (t: BlockchainlinkTarget): SimpleTarget => ({
    type: 'target' as const,
    targetId: createSimpleTargetId(t),
    payload: t,
});

export const createTokenTargetId = (t: TokenTransfer): TxTargetId =>
    asTxTargetId(`token-${t.contract}`);

export const isTokenTargetId = (targetId: TxTargetId) => `${targetId}`.startsWith('token-');

export const createTokenTarget = (t: TokenTransfer): TokenTarget => ({
    type: 'token' as const,
    targetId: createTokenTargetId(t),
    payload: t,
});

export const createInternalTargetId = (t: InternalTransfer) => asTxTargetId(`internal-${t.to}`);

export const createInternalTarget = (t: InternalTransfer): InternalTarget => ({
    type: 'internal' as const,
    targetId: createInternalTargetId(t),
    payload: t,
});

/**
 * Join together regular targets, internal and token transfers
 */
export const createTargets = ({ transaction, account }: CreateCombineTargetsParams): Target[] => {
    const { targets, tokens, internalTransfers } = transaction;

    return [
        ...targets.map(createSimpleTarget),
        ...tokens.filter(token => token.type !== 'self').map(createTokenTarget),
        ...filteredInternalTransfers(internalTransfers, account).map(createInternalTarget),
    ];
};
