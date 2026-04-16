import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import {
    type Target as BlockchainTarget,
    type InternalTransfer,
    type TokenTransfer,
} from '@trezor/blockchain-link-types';

import { createTargets } from '../createTargets';

const makeTarget = (overrides: Partial<BlockchainTarget> = {}): BlockchainTarget => ({
    n: 0,
    isAddress: true,
    amount: '100',
    addresses: ['addr1'],
    ...overrides,
});

const makeTokenTransfer = (overrides: Partial<TokenTransfer> = {}): TokenTransfer => ({
    type: 'sent',
    name: 'Token',
    symbol: 'TKN',
    contract: '0xContractA',
    decimals: 18,
    amount: '500',
    from: '0xFrom',
    to: '0xTo',
    ...overrides,
});

const makeInternalTransfer = (overrides: Partial<InternalTransfer> = {}): InternalTransfer => ({
    type: 'sent',
    amount: '200',
    from: '0xFrom',
    to: '0xInternal',
    ...overrides,
});

const account: Pick<Account, 'descriptor' | 'symbol'> = {
    descriptor: asAccountDescriptor('0xMyAddress'),
    symbol: 'eth' as const,
};

describe(createTargets.name, () => {
    it('returns empty array when transaction has no targets, tokens, or internal transfers', () => {
        const result = createTargets({
            transaction: { targets: [], tokens: [], internalTransfers: [] },
            account,
        });

        expect(result).toEqual([]);
    });

    it('maps regular targets to SimpleTarget entries', () => {
        const targets = [makeTarget({ n: 0 }), makeTarget({ n: 1, amount: '200' })];

        const result = createTargets({
            transaction: { targets, tokens: [], internalTransfers: [] },
            account,
        });

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            type: 'target',
            targetId: '0',
            payload: targets[0],
        });
        expect(result[1]).toEqual({
            type: 'target',
            targetId: '1',
            payload: targets[1],
        });
    });

    it('maps token transfers to TokenTarget entries, filtering out "self" type', () => {
        const tokens = [
            makeTokenTransfer({ type: 'sent', contract: '0xA' }),
            makeTokenTransfer({ type: 'self', contract: '0xB' }),
            makeTokenTransfer({ type: 'recv', contract: '0xC' }),
        ];

        const result = createTargets({
            transaction: { targets: [], tokens, internalTransfers: [] },
            account,
        });

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            type: 'token',
            targetId: 'token-0xA',
            payload: tokens[0],
        });
        expect(result[1]).toEqual({
            type: 'token',
            targetId: 'token-0xC',
            payload: tokens[2],
        });
    });

    it('excludes all token transfers when all have type "self"', () => {
        const tokens = [
            makeTokenTransfer({ type: 'self', contract: '0xA' }),
            makeTokenTransfer({ type: 'self', contract: '0xB' }),
        ];

        const result = createTargets({
            transaction: { targets: [], tokens, internalTransfers: [] },
            account,
        });

        expect(result).toEqual([]);
    });

    it('maps internal transfers to InternalTarget entries', () => {
        const internalTransfers = [
            makeInternalTransfer({ to: '0xAddr1' }),
            makeInternalTransfer({ to: '0xAddr2' }),
        ];

        const result = createTargets({
            transaction: { targets: [], tokens: [], internalTransfers },
            account,
        });

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            type: 'internal',
            targetId: 'internal-0xAddr1',
            payload: internalTransfers[0],
        });
        expect(result[1]).toEqual({
            type: 'internal',
            targetId: 'internal-0xAddr2',
            payload: internalTransfers[1],
        });
    });

    it('filters out internal transfers that are instant staking transactions', () => {
        // An instant stake transfer goes from addressContractPool to addressContractWithdrawTreasury.
        // For eth mainnet the pool address is used as `from` and withdraw treasury as `to`.
        // getInstantStakeType returns 'stake' for such transfers, so they should be excluded.
        // We use a regular internal transfer that won't match staking addresses.
        const regularTransfer = makeInternalTransfer({
            from: '0xRegularFrom',
            to: '0xRegularTo',
        });

        const result = createTargets({
            transaction: {
                targets: [],
                tokens: [],
                internalTransfers: [regularTransfer],
            },
            account,
        });

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            type: 'internal',
            targetId: 'internal-0xRegularTo',
            payload: regularTransfer,
        });
    });

    it('combines all target types in the correct order', () => {
        const targets = [makeTarget({ n: 0 })];
        const tokens = [makeTokenTransfer({ type: 'recv', contract: '0xToken' })];
        const internalTransfers = [makeInternalTransfer({ to: '0xInternal' })];

        const result = createTargets({
            transaction: { targets, tokens, internalTransfers },
            account,
        });

        expect(result).toHaveLength(3);
        expect(result[0]?.type).toBe('target');
        expect(result[1]?.type).toBe('token');
        expect(result[2]?.type).toBe('internal');
    });

    it('generates correct targetId format for each type', () => {
        const result = createTargets({
            transaction: {
                targets: [makeTarget({ n: 42 })],
                tokens: [makeTokenTransfer({ type: 'sent', contract: '0xDeadBeef' })],
                internalTransfers: [makeInternalTransfer({ to: '0xCafe' })],
            },
            account,
        });

        expect(result[0]?.targetId).toBe('42');
        expect(result[1]?.targetId).toBe('token-0xDeadBeef');
        expect(result[2]?.targetId).toBe('internal-0xCafe');
    });

    it('preserves the original payload references', () => {
        const target = makeTarget({ n: 0 });
        const token = makeTokenTransfer({ type: 'sent' });
        const internal = makeInternalTransfer();

        const result = createTargets({
            transaction: {
                targets: [target],
                tokens: [token],
                internalTransfers: [internal],
            },
            account,
        });

        expect(result[0]?.payload).toBe(target);
        expect(result[1]?.payload).toBe(token);
        expect(result[2]?.payload).toBe(internal);
    });
});
