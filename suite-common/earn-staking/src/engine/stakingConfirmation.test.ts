import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    getStakingStepSettlement,
    getStakingStepSettlementAction,
    settleStakingSteps,
} from './stakingConfirmation';
import { mockStakingSession, mockStakingSessionStep } from '../../mocks';
import { stakingActions } from '../state/stakingReducer';
import type { StakingStepTransaction } from '../state/stakingSessionStep';
import type { StakingSession } from '../state/stakingSessionsReducer';

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const awaitingSession = (
    txid: string,
    sessionOverrides: Partial<StakingSession> = {},
    replacements: readonly StakingStepTransaction[] = [],
) =>
    mockStakingSession({
        accountKey: account.key,
        steps: [{ ...mockStakingSessionStep(), status: 'awaiting', txid, replacements }],
        ...sessionOverrides,
    });

const createTransaction = (
    overrides: Partial<WalletAccountTransaction> = {},
): WalletAccountTransaction => ({
    type: 'sent',
    txid: 'tx1',
    amount: '1000000000000000000',
    fee: '462000000000000',
    blockHeight: 100,
    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { vin: [], vout: [], size: 0, totalInput: '0', totalOutput: '0' },
    descriptor: account.descriptor,
    deviceState: account.deviceState,
    symbol: account.symbol,
    ...overrides,
});

const stake = awaitingSession('tx1');
const original: StakingStepTransaction = { txid: 'tx1', isCancellation: false };
const bump: StakingStepTransaction = { txid: 'tx1b', isCancellation: false };
const cancel: StakingStepTransaction = { txid: 'tx1c', isCancellation: true };
const awaiting = { sessionKey: stake.key, stepId: 'stake', transactions: [original] };
const replaced = { ...awaiting, transactions: [original, bump, cancel] };

describe('getStakingStepSettlement', () => {
    it('confirms a mined transaction', () => {
        expect(getStakingStepSettlement(awaiting, createTransaction())).toEqual({
            sessionKey: stake.key,
            stepId: 'stake',
            txid: 'tx1',
            outcome: 'confirmed',
        });
    });

    it('confirms a solana transaction by its status before the block height arrives', () => {
        const transaction: WalletAccountTransaction = {
            ...createTransaction(),
            blockHeight: undefined,
            solanaSpecific: { status: 'confirmed' },
        };

        expect(getStakingStepSettlement(awaiting, transaction)?.outcome).toBe('confirmed');
    });

    it('fails a transaction the chain rejected', () => {
        expect(
            getStakingStepSettlement(awaiting, createTransaction({ type: 'failed' }))?.outcome,
        ).toBe('failed');
    });

    it('settles on whichever of the step transactions mined', () => {
        expect(getStakingStepSettlement(replaced, createTransaction({ txid: 'tx1b' }))).toEqual({
            sessionKey: stake.key,
            stepId: 'stake',
            txid: 'tx1b',
            outcome: 'confirmed',
        });
        expect(
            getStakingStepSettlement(replaced, createTransaction({ txid: 'tx1' }))?.outcome,
        ).toBe('confirmed');
        expect(getStakingStepSettlement(replaced, createTransaction({ txid: 'tx1c' }))).toEqual({
            sessionKey: stake.key,
            stepId: 'stake',
            txid: 'tx1c',
            outcome: 'replaced',
        });
    });

    it('waits while the transaction is missing, pending or not one of the step', () => {
        expect(getStakingStepSettlement(awaiting, null)).toBeNull();
        expect(
            getStakingStepSettlement(awaiting, createTransaction({ blockHeight: undefined })),
        ).toBeNull();
        expect(
            getStakingStepSettlement(awaiting, createTransaction({ blockHeight: -1 })),
        ).toBeNull();
        expect(getStakingStepSettlement(awaiting, createTransaction({ txid: 'tx2' }))).toBeNull();
        expect(
            getStakingStepSettlement(
                replaced,
                createTransaction({ txid: 'tx1c', blockHeight: -1 }),
            ),
        ).toBeNull();
    });
});

describe('settleStakingSteps', () => {
    it('settles every awaiting step with a mined transaction in the batch', () => {
        const claim = awaitingSession('tx2', {
            id: 'session-2',
            plan: { ...stake.plan, operation: 'claim' },
        });
        const unstake = awaitingSession('tx3', {
            id: 'session-3',
            plan: { ...stake.plan, operation: 'unstake' },
        });
        const vote = awaitingSession(
            'tx4',
            { id: 'session-4', plan: { ...stake.plan, operation: 'vote' } },
            [{ txid: 'tx4c', isCancellation: true }],
        );

        expect(
            settleStakingSteps({
                sessions: [stake, claim, unstake, vote],
                transactions: [
                    createTransaction({ txid: 'tx1' }),
                    createTransaction({ txid: 'tx2', type: 'failed' }),
                    createTransaction({ txid: 'tx3', blockHeight: undefined }),
                    createTransaction({ txid: 'tx4c' }),
                ],
            }),
        ).toEqual([
            { sessionKey: stake.key, stepId: 'stake', txid: 'tx1', outcome: 'confirmed' },
            { sessionKey: claim.key, stepId: 'stake', txid: 'tx2', outcome: 'failed' },
            { sessionKey: vote.key, stepId: 'stake', txid: 'tx4c', outcome: 'replaced' },
        ]);
    });
});

describe('getStakingStepSettlementAction', () => {
    const settlement = { sessionKey: stake.key, stepId: 'stake', txid: 'tx1' };

    it('maps the outcome to the step action', () => {
        expect(getStakingStepSettlementAction({ ...settlement, outcome: 'confirmed' })).toEqual(
            stakingActions.stepConfirmed(settlement),
        );
        expect(getStakingStepSettlementAction({ ...settlement, outcome: 'failed' })).toEqual(
            stakingActions.stepFailed({
                ...settlement,
                error: { kind: 'confirmation-failed', code: null },
            }),
        );
        expect(
            getStakingStepSettlementAction({ ...settlement, txid: 'tx1c', outcome: 'replaced' }),
        ).toEqual(
            stakingActions.stepFailed({
                ...settlement,
                txid: 'tx1c',
                error: { kind: 'replaced', code: null },
            }),
        );
    });

    it('is never asked about a product it does not know', () => {
        expect(eth.id).toBe(stake.plan.productId);
    });
});
