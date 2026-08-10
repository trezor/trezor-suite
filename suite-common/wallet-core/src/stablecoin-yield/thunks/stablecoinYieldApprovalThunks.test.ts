import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { BigNumber } from '@trezor/utils';

import { initYieldAllowanceThunk } from './stablecoinYieldApprovalThunks';
import { fetchAllowance } from '../../allowance/fetchAllowance';
import {
    type StablecoinYieldRootState,
    stablecoinYieldActions,
    stablecoinYieldReducer,
} from '../stablecoinYieldReducer';
import { selectStablecoinYieldSession } from '../stablecoinYieldSelectors';
import { type YieldFlowResolvedData } from '../stablecoinYieldTypes';

jest.mock('../../allowance/fetchAllowance', () => ({
    fetchAllowance: jest.fn(),
}));

const FLOW_KEY = 'account-key:yield-id:0xtoken';
const OWNER_ADDRESS = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326';
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const VAULT_ADDRESS = '0xd63070114470f685b75B74D60EEc7c1113d33a3D';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor(OWNER_ADDRESS),
    deviceState: 'mock@device:0',
});

// Wrapped-native (WETH) deposit: 18 decimals, spender resolved from receiptToken.
const flowData = {
    account,
    vault: { id: `eth-${VAULT_ADDRESS}`, chainId: 1 },
    token: {
        networkSymbol: 'eth',
        symbol: 'weth',
        decimals: 18,
        contractAddress: WETH_ADDRESS,
        balance: '100',
    },
    receiptToken: {
        networkSymbol: 'eth',
        symbol: 'wsteth',
        decimals: 18,
        contractAddress: VAULT_ADDRESS,
    },
} as unknown as YieldFlowResolvedData;

// 0.2 WETH in subunits (18 decimals) — the amount the user just wrapped.
const WRAPPED_AMOUNT = '0.2';
const toSubunits = (weth: string) => new BigNumber(weth).shiftedBy(18);

const initStore = () =>
    configureMockStore({
        reducer: combineReducers({
            wallet: combineReducers({ stablecoinYield: stablecoinYieldReducer }),
        }),
    });

const getStep = (store: ReturnType<typeof initStore>) =>
    selectStablecoinYieldSession(store.getState() as StablecoinYieldRootState, 'deposit', FLOW_KEY)
        .step;

const getApproval = (store: ReturnType<typeof initStore>) =>
    selectStablecoinYieldSession(store.getState() as StablecoinYieldRootState, 'deposit', FLOW_KEY)
        .approval;

// Seed a wrapped-native deposit session sitting on the `approve` step, with the
// just-wrapped amount stored in `session.action.amount` (mirrors the wrap→approve
// transition produced by resolveWrappedNativeStep after the wrap tx confirms).
const seedWrappedDepositAtApprove = (store: ReturnType<typeof initStore>, amount: string) => {
    store.dispatch(
        stablecoinYieldActions.initSession({
            flowType: 'deposit',
            flowKey: FLOW_KEY,
            isWrappedNativeVault: true,
        }),
    );
    store.dispatch(
        stablecoinYieldActions.resolveWrappedNativeStep({
            flowType: 'deposit',
            flowKey: FLOW_KEY,
            step: 'wrap',
            amount,
        }),
    );
};

describe('initYieldAllowanceThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the approve step when a dust allowance is smaller than the wrapped amount (#30551)', async () => {
        // Leftover dust allowance, far below the 0.2 WETH just wrapped.
        (fetchAllowance as jest.Mock).mockResolvedValue(new BigNumber('1000'));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);
        expect(getStep(store)).toBe('approve');

        await store
            .dispatch(initYieldAllowanceThunk({ flowType: 'deposit', flowKey: FLOW_KEY, flowData }))
            .unwrap();

        expect(getStep(store)).toBe('approve');
    });

    it('skips the approve step when the allowance already covers the wrapped amount', async () => {
        // 0.3 WETH allowance ≥ 0.2 WETH wrapped.
        (fetchAllowance as jest.Mock).mockResolvedValue(toSubunits('0.3'));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);

        await store
            .dispatch(initYieldAllowanceThunk({ flowType: 'deposit', flowKey: FLOW_KEY, flowData }))
            .unwrap();

        expect(getStep(store)).toBe('action');
    });

    it('skips the approve step when the allowance exactly equals the wrapped amount', async () => {
        (fetchAllowance as jest.Mock).mockResolvedValue(toSubunits(WRAPPED_AMOUNT));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);

        await store
            .dispatch(initYieldAllowanceThunk({ flowType: 'deposit', flowKey: FLOW_KEY, flowData }))
            .unwrap();

        expect(getStep(store)).toBe('action');
    });

    it('skips on any non-zero allowance when no amount is entered yet (non-wrapped deposit)', async () => {
        // Non-wrapped deposit: the approve step precedes amount entry, so there is no
        // request amount to compare against — legacy skip-on-nonzero behavior is preserved.
        (fetchAllowance as jest.Mock).mockResolvedValue(new BigNumber('1000'));

        const store = initStore();
        store.dispatch(
            stablecoinYieldActions.initSession({ flowType: 'deposit', flowKey: FLOW_KEY }),
        );
        expect(getStep(store)).toBe('approve');

        await store
            .dispatch(initYieldAllowanceThunk({ flowType: 'deposit', flowKey: FLOW_KEY, flowData }))
            .unwrap();

        expect(getStep(store)).toBe('action');
    });

    it('keeps the approve step when there is no allowance at all', async () => {
        (fetchAllowance as jest.Mock).mockResolvedValue(new BigNumber('0'));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);

        await store
            .dispatch(initYieldAllowanceThunk({ flowType: 'deposit', flowKey: FLOW_KEY, flowData }))
            .unwrap();

        expect(getStep(store)).toBe('approve');
    });

    it('holds the step when skipping is opted out of, even on a covering allowance', async () => {
        (fetchAllowance as jest.Mock).mockResolvedValue(toSubunits('0.3'));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);

        await store
            .dispatch(
                initYieldAllowanceThunk({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    flowData,
                    shouldSkipApprovalStep: false,
                }),
            )
            .unwrap();

        expect(getStep(store)).toBe('approve');
        expect(getApproval(store).allowanceAmount).toBe('0.3');
    });

    it('refreshes the allowance on the action step without moving the flow', async () => {
        (fetchAllowance as jest.Mock).mockResolvedValue(toSubunits('0.3'));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);
        store.dispatch(
            stablecoinYieldActions.completeApproval({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
                amount: WRAPPED_AMOUNT,
            }),
        );
        store.dispatch(
            stablecoinYieldActions.invalidateAllowance({ flowType: 'deposit', flowKey: FLOW_KEY }),
        );
        expect(getStep(store)).toBe('action');

        await store
            .dispatch(
                initYieldAllowanceThunk({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    flowData,
                    shouldSkipApprovalStep: false,
                }),
            )
            .unwrap();

        expect(getStep(store)).toBe('action');
        expect(getApproval(store).allowanceStatus).toBe('loaded');
        expect(getApproval(store).allowanceAmount).toBe('0.3');
    });

    it('records an error and rethrows when the allowance cannot be read', async () => {
        (fetchAllowance as jest.Mock).mockRejectedValue(new Error('rpc unavailable'));

        const store = initStore();
        seedWrappedDepositAtApprove(store, WRAPPED_AMOUNT);

        // `unwrap` rethrows redux's serialized error, which is a plain object rather than an
        // Error instance — hence matching on the shape instead of `toThrow`.
        await expect(
            store
                .dispatch(
                    initYieldAllowanceThunk({ flowType: 'deposit', flowKey: FLOW_KEY, flowData }),
                )
                .unwrap(),
        ).rejects.toMatchObject({ message: 'rpc unavailable' });

        expect(getApproval(store).allowanceStatus).toBe('error');
        expect(getApproval(store).allowanceAmount).toBeNull();
        expect(getStep(store)).toBe('approve');
    });
});
