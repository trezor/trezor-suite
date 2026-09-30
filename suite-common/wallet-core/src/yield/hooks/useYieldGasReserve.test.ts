/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo } from '@suite-common/wallet-types';

import { feesActions } from '../../fees/feesActions';
import { type FeesRootState, feesReducer } from '../../fees/feesReducer';
import { FALLBACK_YIELD_GAS_RESERVE } from '../utils/yieldGasReserve';
import {
    type YieldRootState,
    getYieldSessionKey,
    yieldActions,
    yieldReducer,
} from '../yieldReducer';
import { useYieldGasReserve } from './useYieldGasReserve';

type RootState = FeesRootState & YieldRootState;

const ethSymbol = asNetworkSymbol('eth');
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const FLOW_KEY = 'account-key:yield-id:0xtoken';

// Raw fee info is stored in wei.
const createFeeInfo = (feePerUnitWei: string): FeeInfo => ({
    blockHeight: 1,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [{ label: 'normal', feePerUnit: feePerUnitWei, blocks: 2 }],
});

const ONE_GWEI_RESERVE = { minimum: '0.001', recommended: '0.005' };
const TEN_GWEI_RESERVE = { minimum: '0.01', recommended: '0.05' };

const createRoot = () =>
    createTestCompositionRoot<void, RootState>({
        reducer: combineReducers({
            wallet: combineReducers({ fees: feesReducer, stablecoinYield: yieldReducer }),
        }),
    });

const setFees = (root: ReturnType<typeof createRoot>, feePerUnitWei: string) =>
    act(() => {
        root.services.store.dispatch(
            feesActions.updateMultipleFees({
                [ethSymbol]: { status: 'loaded', data: createFeeInfo(feePerUnitWei) },
            }),
        );
    });

const initSession = (root: ReturnType<typeof createRoot>) =>
    act(() => {
        root.services.store.dispatch(
            yieldActions.initSession({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
                isWrappedNativeVault: true,
            }),
        );
    });

describe('useYieldGasReserve', () => {
    describe('without a session', () => {
        it('falls back to the static reserve until a fee estimate is available', () => {
            const root = createRoot();
            const { result } = renderHookWithStoreProvider(
                () =>
                    useYieldGasReserve({
                        networkSymbol: ethSymbol,
                        isWrappedNativeVault: true,
                        tokenContractAddress: WETH_ADDRESS,
                    }),
                { services: root.services },
            );

            expect(result.current).toBe(FALLBACK_YIELD_GAS_RESERVE);
        });

        it('latches the first fee estimate for the component lifetime', () => {
            const root = createRoot();
            const { result, rerender } = renderHookWithStoreProvider(
                () =>
                    useYieldGasReserve({
                        networkSymbol: ethSymbol,
                        isWrappedNativeVault: true,
                        tokenContractAddress: WETH_ADDRESS,
                    }),
                { services: root.services },
            );

            setFees(root, '1000000000');
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            setFees(root, '10000000000');
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });
    });

    describe('with a session', () => {
        const renderWithSession = (root: ReturnType<typeof createRoot>) =>
            renderHookWithStoreProvider(
                () =>
                    useYieldGasReserve({
                        networkSymbol: ethSymbol,
                        isWrappedNativeVault: true,
                        tokenContractAddress: WETH_ADDRESS,
                        flowType: 'deposit',
                        flowKey: FLOW_KEY,
                    }),
                { services: root.services },
            );

        const getSessionReserve = (root: ReturnType<typeof createRoot>) =>
            root.services.store.getState().wallet.stablecoinYield.deposit[
                getYieldSessionKey(FLOW_KEY)
            ]?.gasReserve;

        it('freezes the first fee estimate into the session', () => {
            const root = createRoot();
            initSession(root);
            const { result, rerender } = renderWithSession(root);

            expect(result.current).toBe(FALLBACK_YIELD_GAS_RESERVE);

            setFees(root, '1000000000');
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
            expect(getSessionReserve(root)).toEqual(ONE_GWEI_RESERVE);

            setFees(root, '10000000000');
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });

        it('reuses a reserve already frozen in the session', () => {
            const root = createRoot();
            initSession(root);
            root.services.store.dispatch(
                yieldActions.freezeGasReserve({
                    flowType: 'deposit',
                    flowKey: FLOW_KEY,
                    gasReserve: TEN_GWEI_RESERVE,
                }),
            );
            setFees(root, '1000000000');

            const { result } = renderWithSession(root);

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
        });

        it('uses the live estimate without freezing while the session does not exist yet', () => {
            const root = createRoot();
            setFees(root, '1000000000');

            const { result } = renderWithSession(root);

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
            expect(getSessionReserve(root)).toBeUndefined();
        });

        it('freezes into a session created after the fee estimate arrived', () => {
            const root = createRoot();
            setFees(root, '1000000000');
            const { result, rerender } = renderWithSession(root);

            initSession(root);
            rerender();

            expect(getSessionReserve(root)).toEqual(ONE_GWEI_RESERVE);

            setFees(root, '10000000000');
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });
    });
});
