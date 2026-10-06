/**
 * @jest-environment jsdom
 */
import { combineReducers } from '@reduxjs/toolkit';

import {
    act,
    createTestCompositionRoot,
    renderHookWithStoreProvider,
} from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { type FeeInfo, type FeesStatus } from '@suite-common/wallet-types';

import { feesActions } from '../../fees/feesActions';
import { type FeesRootState, feesReducer } from '../../fees/feesReducer';
import { updateFeeInfoThunk } from '../../fees/feesThunks';
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
const polSymbol = asNetworkSymbol('pol');
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const FLOW_KEY = 'account-key:yield-id:0xtoken';
const REQUEST_ID = 'request-id';

// Raw fee info is stored in wei.
const createFeeInfo = (feePerUnitWei: string): FeeInfo => ({
    blockHeight: 1,
    blockTime: 12,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 1,
    levels: [{ label: 'normal', feePerUnit: feePerUnitWei, blocks: 2 }],
});

const ONE_GWEI = '1000000000';
const TEN_GWEI = '10000000000';
const ONE_GWEI_RESERVE = { minimum: '0.001', recommended: '0.005' };
const TEN_GWEI_RESERVE = { minimum: '0.01', recommended: '0.05' };

const createRoot = () =>
    createTestCompositionRoot<void, RootState>({
        reducer: combineReducers({
            wallet: combineReducers({ fees: feesReducer, stablecoinYield: yieldReducer }),
        }),
    });

type Root = ReturnType<typeof createRoot>;

const storeFees = (
    root: Root,
    feePerUnitWei: string,
    status: FeesStatus,
    networkSymbol: NetworkSymbol = ethSymbol,
) =>
    act(() => {
        root.services.store.dispatch(
            feesActions.updateMultipleFees({
                [networkSymbol]: { status, data: createFeeInfo(feePerUnitWei) },
            }),
        );
    });

const startFetch = (root: Root, networkSymbol: NetworkSymbol = ethSymbol) =>
    act(() => {
        root.services.store.dispatch(updateFeeInfoThunk.pending(REQUEST_ID, { networkSymbol }));
    });

const finishFetch = (root: Root, feePerUnitWei: string, networkSymbol: NetworkSymbol = ethSymbol) =>
    act(() => {
        root.services.store.dispatch(
            updateFeeInfoThunk.fulfilled(createFeeInfo(feePerUnitWei), REQUEST_ID, {
                networkSymbol,
            }),
        );
    });

const failFetch = (root: Root) =>
    act(() => {
        root.services.store.dispatch(
            updateFeeInfoThunk.rejected(null, REQUEST_ID, { networkSymbol: ethSymbol }),
        );
    });

const fetchFees = (root: Root, feePerUnitWei: string, networkSymbol: NetworkSymbol = ethSymbol) => {
    startFetch(root, networkSymbol);
    finishFetch(root, feePerUnitWei, networkSymbol);
};

const initSession = (root: Root) =>
    act(() => {
        root.services.store.dispatch(
            yieldActions.initSession({
                flowType: 'deposit',
                flowKey: FLOW_KEY,
                isWrappedNativeVault: true,
            }),
        );
    });

const getSessionReserve = (root: Root) =>
    root.services.store.getState().wallet.stablecoinYield.deposit[getYieldSessionKey(FLOW_KEY)]
        ?.gasReserve;

describe('useYieldGasReserve', () => {
    describe('without a session', () => {
        const renderWithoutSession = (root: Root) =>
            renderHookWithStoreProvider(
                () =>
                    useYieldGasReserve({
                        networkSymbol: ethSymbol,
                        isWrappedNativeVault: true,
                        tokenContractAddress: WETH_ADDRESS,
                    }),
                { services: root.services },
            );

        it('falls back to the static reserve until a fee estimate is available', () => {
            const root = createRoot();
            const { result } = renderWithoutSession(root);

            expect(result.current).toBe(FALLBACK_YIELD_GAS_RESERVE);
        });

        it('latches the first estimate fetched after mount for the component lifetime', () => {
            const root = createRoot();
            const { result, rerender } = renderWithoutSession(root);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            fetchFees(root, TEN_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });

        it('shows the preloaded defaults present at mount but latches only a fetched estimate', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'preloaded');
            const { result, rerender } = renderWithoutSession(root);

            expect(result.current).toEqual(TEN_GWEI_RESERVE);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            fetchFees(root, TEN_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });

        it('shows a stale estimate present at mount but latches only a fetched one', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'loaded');
            const { result, rerender } = renderWithoutSession(root);

            expect(result.current).toEqual(TEN_GWEI_RESERVE);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });

        it('keeps showing the estimate present at mount when the fetch fails', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'preloaded');
            const { result, rerender } = renderWithoutSession(root);

            startFetch(root);
            rerender();

            expect(result.current).toEqual(TEN_GWEI_RESERVE);

            failFetch(root);
            rerender();

            expect(result.current).toEqual(TEN_GWEI_RESERVE);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });
    });

    describe('with a session', () => {
        const renderWithSession = (root: Root) =>
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

        it('freezes the first estimate fetched after mount into the session', () => {
            const root = createRoot();
            initSession(root);
            const { result, rerender } = renderWithSession(root);

            expect(result.current).toBe(FALLBACK_YIELD_GAS_RESERVE);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
            expect(getSessionReserve(root)).toEqual(ONE_GWEI_RESERVE);

            fetchFees(root, TEN_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });

        it('shows the preloaded defaults present at mount but freezes only a fetched estimate', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'preloaded');
            initSession(root);
            const { result, rerender } = renderWithSession(root);

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
            expect(getSessionReserve(root)).toBeNull();

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
            expect(getSessionReserve(root)).toEqual(ONE_GWEI_RESERVE);
        });

        it('shows a stale estimate present at mount but freezes only a fetched one', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'loaded');
            initSession(root);
            const { result, rerender } = renderWithSession(root);

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
            expect(getSessionReserve(root)).toBeNull();

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(getSessionReserve(root)).toEqual(ONE_GWEI_RESERVE);
        });

        it('does not freeze the estimate present at mount when the fetch fails', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'preloaded');
            initSession(root);
            const { result, rerender } = renderWithSession(root);

            startFetch(root);
            failFetch(root);
            rerender();

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
            expect(getSessionReserve(root)).toBeNull();
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
            const { result, rerender } = renderWithSession(root);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
        });

        it('uses the fetched estimate without freezing while the session does not exist yet', () => {
            const root = createRoot();
            const { result, rerender } = renderWithSession(root);

            fetchFees(root, ONE_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
            expect(getSessionReserve(root)).toBeUndefined();
        });

        it('freezes into a session created after the fetched estimate arrived', () => {
            const root = createRoot();
            const { result, rerender } = renderWithSession(root);

            fetchFees(root, ONE_GWEI);
            initSession(root);
            rerender();

            expect(getSessionReserve(root)).toEqual(ONE_GWEI_RESERVE);

            fetchFees(root, TEN_GWEI);
            rerender();

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });
    });
    describe('when the inputs change while mounted', () => {
        type Params = Parameters<typeof useYieldGasReserve>[0];

        const latchParams: Params = {
            networkSymbol: ethSymbol,
            isWrappedNativeVault: true,
            tokenContractAddress: WETH_ADDRESS,
        };

        const renderWithParams = (root: Root, initialProps: Params) =>
            renderHookWithStoreProvider((params: Params) => useYieldGasReserve(params), {
                services: root.services,
                initialProps,
            });

        it('drops the latched reserve of the previous network', () => {
            const root = createRoot();
            const { result, rerender } = renderWithParams(root, latchParams);

            fetchFees(root, ONE_GWEI);
            rerender(latchParams);

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            rerender({ ...latchParams, networkSymbol: polSymbol });

            expect(result.current).toBe(FALLBACK_YIELD_GAS_RESERVE);

            fetchFees(root, TEN_GWEI, polSymbol);
            rerender({ ...latchParams, networkSymbol: polSymbol });

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
        });

        it('does not latch the estimate already present for the new network', () => {
            const root = createRoot();
            storeFees(root, TEN_GWEI, 'loaded', polSymbol);
            const { result, rerender } = renderWithParams(root, latchParams);

            fetchFees(root, ONE_GWEI);
            rerender(latchParams);

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            rerender({ ...latchParams, networkSymbol: polSymbol });

            expect(result.current).toEqual(TEN_GWEI_RESERVE);

            fetchFees(root, ONE_GWEI, polSymbol);
            rerender({ ...latchParams, networkSymbol: polSymbol });

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            fetchFees(root, TEN_GWEI, polSymbol);
            rerender({ ...latchParams, networkSymbol: polSymbol });

            expect(result.current).toEqual(ONE_GWEI_RESERVE);
        });

        it('starts over when the flow enters session mode', () => {
            const root = createRoot();
            const { result, rerender } = renderWithParams(root, latchParams);

            fetchFees(root, ONE_GWEI);
            rerender(latchParams);

            expect(result.current).toEqual(ONE_GWEI_RESERVE);

            initSession(root);
            const sessionParams: Params = {
                ...latchParams,
                flowType: 'deposit',
                flowKey: FLOW_KEY,
            };
            rerender(sessionParams);

            expect(getSessionReserve(root)).toBeNull();

            fetchFees(root, TEN_GWEI);
            rerender(sessionParams);

            expect(result.current).toEqual(TEN_GWEI_RESERVE);
            expect(getSessionReserve(root)).toEqual(TEN_GWEI_RESERVE);
        });
    });
});
