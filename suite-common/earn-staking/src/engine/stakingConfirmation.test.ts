import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    getAwaitingStakingSteps,
    getStakingStepSettlement,
    getStakingStepSettlementAction,
    settleStakingSteps,
} from './stakingConfirmation';
import { mockStakingSession, mockStakingSessionStep } from '../../mocks';
import { stakingActions } from '../state/stakingReducer';
import type { StakingSession } from '../state/stakingSessionsReducer';

const eth = mockStakingProductDescriptor();
const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

const awaitingSession = (txid: string, sessionOverrides: Partial<StakingSession> = {}) =>
    mockStakingSession({
        accountKey: account.key,
        steps: [{ ...mockStakingSessionStep(), status: 'awaiting', txid }],
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

describe('getAwaitingStakingSteps', () => {
    it('lists the awaiting steps of every session with their txids', () => {
        const stake = awaitingSession('tx1');
        const claim = awaitingSession('tx2', {
            id: 'session-2',
            plan: { ...stake.plan, operation: 'claim' },
        });
        const idle = mockStakingSession({ accountKey: account.key, id: 'session-3' });

        expect(getAwaitingStakingSteps([stake, idle, claim])).toEqual([
            { sessionKey: stake.key, stepId: 'stake', txid: 'tx1' },
            { sessionKey: claim.key, stepId: 'stake', txid: 'tx2' },
        ]);
        expect(getAwaitingStakingSteps([idle])).toEqual([]);
    });
});

describe('getStakingStepSettlement', () => {
    const awaiting = { sessionKey: awaitingSession('tx1').key, stepId: 'stake', txid: 'tx1' };

    it('confirms a mined transaction', () => {
        expect(getStakingStepSettlement(awaiting, createTransaction())).toEqual({
            ...awaiting,
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
        expect(getStakingStepSettlement(awaiting, createTransaction({ type: 'failed' }))).toEqual({
            ...awaiting,
            outcome: 'failed',
        });
    });

    it('waits while the transaction is missing, pending or another one', () => {
        expect(getStakingStepSettlement(awaiting, null)).toBeNull();
        expect(
            getStakingStepSettlement(awaiting, createTransaction({ blockHeight: undefined })),
        ).toBeNull();
        expect(
            getStakingStepSettlement(awaiting, createTransaction({ blockHeight: -1 })),
        ).toBeNull();
        expect(getStakingStepSettlement(awaiting, createTransaction({ txid: 'tx2' }))).toBeNull();
    });
});

describe('settleStakingSteps', () => {
    it('settles every awaiting step whose transaction is in the batch', () => {
        const stake = awaitingSession('tx1');
        const claim = awaitingSession('tx2', {
            id: 'session-2',
            plan: { ...stake.plan, operation: 'claim' },
        });
        const unstake = awaitingSession('tx3', {
            id: 'session-3',
            plan: { ...stake.plan, operation: 'unstake' },
        });

        expect(
            settleStakingSteps({
                sessions: [stake, claim, unstake],
                transactions: [
                    createTransaction({ txid: 'tx1' }),
                    createTransaction({ txid: 'tx2', type: 'failed' }),
                    createTransaction({ txid: 'tx3', blockHeight: undefined }),
                ],
            }),
        ).toEqual([
            { sessionKey: stake.key, stepId: 'stake', txid: 'tx1', outcome: 'confirmed' },
            { sessionKey: claim.key, stepId: 'stake', txid: 'tx2', outcome: 'failed' },
        ]);
    });
});

describe('getStakingStepSettlementAction', () => {
    const stake = awaitingSession('tx1');

    it('maps the outcome to the step action', () => {
        expect(
            getStakingStepSettlementAction({
                sessionKey: stake.key,
                stepId: 'stake',
                txid: 'tx1',
                outcome: 'confirmed',
            }),
        ).toEqual(stakingActions.stepConfirmed({ sessionKey: stake.key, stepId: 'stake' }));
        expect(
            getStakingStepSettlementAction({
                sessionKey: stake.key,
                stepId: 'stake',
                txid: 'tx1',
                outcome: 'failed',
            }),
        ).toEqual(
            stakingActions.stepFailed({
                sessionKey: stake.key,
                stepId: 'stake',
                error: { kind: 'confirmation-failed', code: null },
            }),
        );
    });

    it('is never asked about a product it does not know', () => {
        expect(eth.id).toBe(stake.plan.productId);
    });
});
