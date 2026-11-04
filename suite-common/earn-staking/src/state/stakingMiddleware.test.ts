import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';

import type { StakingProductAdapter } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductAdapter,
    mockStakingProductDescriptor,
    mockStakingProductInfo,
} from '@suite-common/earn-staking-common/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import {
    type AccountsRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    accountsActions,
    changeNetworks,
    handleEarnTransactionReplacementThunk,
    initialWalletSettingsState,
    transactionsActions,
    transactionsInitialState,
} from '@suite-common/wallet-core';
import type {
    PrecomposedTransactionFinalBumpFeeRbf,
    PrecomposedTransactionFinalCancelRbf,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { type StakingMiddlewareDeps, prepareStakingMiddleware } from './stakingMiddleware';
import { getCachedStakingProductInfo } from './stakingProductInfoQuery';
import { type StakingRootState, type StakingState, stakingReducer } from './stakingReducer';
import {
    mockStakingDeviceAccess,
    mockStakingQueryClient,
    mockStakingSession,
    mockStakingSessionStep,
    mockStakingState,
} from '../../mocks';
import { createStakingCompositionRoot } from '../createStakingCompositionRoot';
import { selectStakingPositionsByAccount } from './stakingSelectors';
import { selectStakingSession } from './stakingSessionSelectors';

type StakingMiddlewareTestState = StakingRootState &
    AccountsRootState &
    TransactionsRootState &
    WalletSettingsRootState;

const eth = mockStakingProductDescriptor();
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const btcAccount = mockWalletAccount({ symbol: asNetworkSymbol('btc') });
const position = mockStakingPosition();

const flushThunks = () => new Promise(resolve => setTimeout(resolve, 0));

const transactionsReducer = (
    state: StakingMiddlewareTestState['wallet']['transactions'] = transactionsInitialState,
    action: UnknownAction,
): StakingMiddlewareTestState['wallet']['transactions'] =>
    transactionsActions.addTransaction.match(action)
        ? {
              ...state,
              transactions: {
                  ...state.transactions,
                  [action.payload.account.key]: action.payload.transactions,
              },
          }
        : state;

const initStore = (
    adapterOverrides: Partial<StakingProductAdapter> = {},
    preloadedStaking?: StakingState,
) => {
    const adapter = mockStakingProductAdapter({
        descriptor: eth,
        getPosition: mock<StakingProductAdapter['getPosition']>(() => position),
        fetchProductInfo: mock<StakingProductAdapter['fetchProductInfo']>(() =>
            Promise.resolve(mockStakingProductInfo()),
        ),
        ...adapterOverrides,
    });
    const queryClient = mockStakingQueryClient();
    let getExtra: () => StakingMiddlewareDeps = () => {
        throw new Error('Services are not composed yet');
    };
    const root = createTestCompositionRoot<StakingMiddlewareDeps, StakingMiddlewareTestState>({
        services: store => {
            const staking = createStakingCompositionRoot({
                platform: 'desktop',
                adapters: [adapter],
                deviceAccess: mockStakingDeviceAccess(),
                dispatch: store.dispatch,
            });
            getExtra = () => ({ services: { staking, queryClient } });

            return { staking, queryClient };
        },
        middleware: [prepareStakingMiddleware(() => getExtra())],
        reducer: {
            earn: combineReducers({ staking: stakingReducer }),
            wallet: combineReducers({
                accounts: (state = [ethAccount, btcAccount]) => state,
                transactions: transactionsReducer,
                settings: (state = initialWalletSettingsState) => state,
            }),
        },
        preloadedState: {
            ...(preloadedStaking === undefined ? {} : { earn: { staking: preloadedStaking } }),
            wallet: {
                settings: {
                    ...initialWalletSettingsState,
                    enabledNetworks: [asNetworkSymbol('eth')],
                },
            },
        },
    });

    return { ...root.services, adapter, queryClient };
};

describe('prepareStakingMiddleware', () => {
    it('syncs every account once the products are registered', async () => {
        const { store, staking, adapter } = initStore();

        staking.loadStakingProducts();
        await flushThunks();

        expect(adapter.getPosition).toHaveBeenCalledTimes(1);
        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: null,
            transactions: [],
        });
        expect(selectStakingPositionsByAccount(store.getState(), ethAccount.key)).toEqual([
            position,
        ]);
    });

    it('syncs an account that was created or updated on a network with a product', async () => {
        const { store, staking, adapter } = initStore();

        staking.loadStakingProducts();
        await flushThunks();
        jest.mocked(adapter.getPosition).mockClear();

        store.dispatch(accountsActions.updateAccount(ethAccount));
        store.dispatch(accountsActions.updateAccount(btcAccount));
        store.dispatch({
            type: accountsActions.createAccount.type,
            payload: { account: ethAccount, supportedNetworks: [asNetworkSymbol('eth')] },
        });
        await flushThunks();

        expect(adapter.getPosition).toHaveBeenCalledTimes(2);
    });

    it('refreshes the product info when the enabled networks change, then re-syncs', async () => {
        const { store, staking, adapter, queryClient } = initStore();

        staking.loadStakingProducts();
        await flushThunks();
        jest.mocked(adapter.getPosition).mockClear();

        store.dispatch(changeNetworks([asNetworkSymbol('eth')], [asNetworkSymbol('eth')]));
        await flushThunks();

        expect(adapter.fetchProductInfo).toHaveBeenCalledTimes(1);
        expect(getCachedStakingProductInfo(queryClient, eth.id)).toEqual(mockStakingProductInfo());
        expect(adapter.getPosition).toHaveBeenCalledWith({
            account: ethAccount,
            productInfo: mockStakingProductInfo(),
            transactions: [],
        });
    });

    describe('confirmation', () => {
        const session = mockStakingSession({
            accountKey: ethAccount.key,
            steps: [
                { ...mockStakingSessionStep(), status: 'awaiting', txid: 'tx1', replacements: [] },
            ],
        });
        const { key: sessionKey } = session;
        const awaiting = () => mockStakingState({ descriptors: [eth], sessions: [session] });
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
            descriptor: ethAccount.descriptor,
            deviceState: ethAccount.deviceState,
            symbol: ethAccount.symbol,
            ...overrides,
        });
        const bumpFee: PrecomposedTransactionFinalBumpFeeRbf = {
            type: 'final',
            totalSpent: '1000500000000000000',
            fee: '500000000000000',
            feePerByte: '2.5',
            bytes: 0,
            inputs: [],
            outputs: [],
            outputsPermutation: [],
            rbfType: 'bump-fee',
            prevTxid: 'tx1',
            feeDifference: '38000000000000',
            useNativeRbf: false,
        };
        const cancel: PrecomposedTransactionFinalCancelRbf = {
            type: 'final',
            totalSpent: '500000000000000',
            fee: '500000000000000',
            feePerByte: '2.5',
            bytes: 0,
            inputs: [],
            outputs: [],
            outputsPermutation: [],
            rbfType: 'cancel',
            prevTxid: 'tx1',
        };
        const replacement = (
            precomposedTransaction:
                PrecomposedTransactionFinalBumpFeeRbf | PrecomposedTransactionFinalCancelRbf,
            txid: string | null,
        ) =>
            handleEarnTransactionReplacementThunk.pending('request', {
                account: ethAccount,
                precomposedTransaction,
                txid,
            });
        const getStep = (store: ReturnType<typeof initStore>['store']) =>
            selectStakingSession(store.getState(), sessionKey)?.steps[0];

        it('confirms an awaiting step from its mined transaction and re-syncs the positions', async () => {
            const { store, adapter } = initStore({}, awaiting());

            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [createTransaction()],
                }),
            );
            await flushThunks();

            expect(getStep(store)).toMatchObject({ status: 'done', txid: 'tx1' });
            expect(adapter.getPosition).toHaveBeenCalledWith({
                account: ethAccount,
                productInfo: null,
                transactions: [createTransaction()],
            });
        });

        it('passes the pending transaction, then the mined one, with the account updates', async () => {
            const { store, staking, adapter } = initStore();
            const pending = createTransaction({ blockHeight: undefined });
            const mined = createTransaction();

            staking.loadStakingProducts();
            await flushThunks();

            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [pending],
                }),
            );
            store.dispatch(accountsActions.updateAccount(ethAccount));
            await flushThunks();

            expect(adapter.getPosition).toHaveBeenLastCalledWith({
                account: ethAccount,
                productInfo: null,
                transactions: [pending],
            });

            store.dispatch(
                transactionsActions.addTransaction({ account: ethAccount, transactions: [mined] }),
            );
            store.dispatch(accountsActions.updateAccount(ethAccount));
            await flushThunks();

            expect(adapter.getPosition).toHaveBeenLastCalledWith({
                account: ethAccount,
                productInfo: null,
                transactions: [mined],
            });
        });

        it('fails an awaiting step whose transaction the chain rejected', async () => {
            const { store } = initStore({}, awaiting());

            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [createTransaction({ type: 'failed' })],
                }),
            );
            await flushThunks();

            expect(getStep(store)).toMatchObject({
                status: 'failed',
                error: { kind: 'confirmation-failed', code: null },
            });
        });

        it('keeps waiting for a pending transaction or one of another account', async () => {
            const { store, adapter } = initStore({}, awaiting());

            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [createTransaction({ blockHeight: undefined })],
                }),
            );
            store.dispatch(
                transactionsActions.addTransaction({
                    account: btcAccount,
                    transactions: [createTransaction()],
                }),
            );
            await flushThunks();

            expect(getStep(store)).toMatchObject({
                status: 'awaiting',
                txid: 'tx1',
                replacements: [],
            });
            expect(adapter.getPosition).not.toHaveBeenCalled();
        });

        it('keeps a bumped transaction next to the original and confirms on either', async () => {
            const { store } = initStore({}, awaiting());

            store.dispatch(replacement(bumpFee, 'tx1b'));

            expect(getStep(store)).toMatchObject({
                status: 'awaiting',
                txid: 'tx1',
                replacements: [{ txid: 'tx1b', isCancellation: false }],
            });

            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [createTransaction({ txid: 'tx1b' })],
                }),
            );
            await flushThunks();

            expect(getStep(store)).toMatchObject({ status: 'done', txid: 'tx1b' });
        });

        it('fails a step only once its cancel replacement is mined', async () => {
            const { store } = initStore({}, awaiting());

            store.dispatch(replacement(cancel, 'tx1c'));

            expect(getStep(store)).toMatchObject({
                status: 'awaiting',
                txid: 'tx1',
                replacements: [{ txid: 'tx1c', isCancellation: true }],
            });

            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [createTransaction({ txid: 'tx1c' })],
                }),
            );
            await flushThunks();

            expect(getStep(store)).toMatchObject({
                status: 'failed',
                txid: 'tx1c',
                error: { kind: 'replaced', code: null },
            });
        });

        it('confirms a step whose original outran its cancel replacement', async () => {
            const { store } = initStore({}, awaiting());

            store.dispatch(replacement(cancel, 'tx1c'));
            store.dispatch(
                transactionsActions.addTransaction({
                    account: ethAccount,
                    transactions: [createTransaction({ txid: 'tx1' })],
                }),
            );
            await flushThunks();

            expect(getStep(store)).toMatchObject({ status: 'done', txid: 'tx1' });
        });

        it('ignores a replacement that was not broadcast', () => {
            const { store } = initStore({}, awaiting());

            store.dispatch(replacement(bumpFee, null));

            expect(getStep(store)).toMatchObject({
                status: 'awaiting',
                txid: 'tx1',
                replacements: [],
            });
        });

        it('follows a transaction replaced in the store', () => {
            const { store } = initStore({}, awaiting());

            store.dispatch(
                transactionsActions.replaceTransaction({
                    key: ethAccount.key,
                    txid: 'tx1',
                    tx: createTransaction({ txid: 'tx1b', blockHeight: undefined }),
                }),
            );

            expect(getStep(store)).toMatchObject({
                status: 'awaiting',
                txid: 'tx1',
                replacements: [{ txid: 'tx1b', isCancellation: false }],
            });
        });
    });
});
