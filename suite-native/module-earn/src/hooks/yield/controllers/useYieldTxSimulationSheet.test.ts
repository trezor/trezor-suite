import { combineReducers } from '@reduxjs/toolkit';

import {
    type YieldRootState,
    selectYieldSession,
    yieldActions,
    yieldReducer,
} from '@suite-common/wallet-core';
import {
    type TestStore,
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    waitFor,
} from '@suite-native/test-utils-store';

import { useYieldTxSimulationSheet } from './useYieldTxSimulationSheet';

const mockOpenModal = jest.fn();
const mockCloseModal = jest.fn();

jest.mock('@suite-native/atoms', () => ({
    ...jest.requireActual('@suite-native/atoms'),
    useBottomSheetModal: () => ({
        bottomSheetRef: { current: null },
        openModal: mockOpenModal,
        closeModal: mockCloseModal,
    }),
}));

const FLOW_KEY = 'account-key:yield-id:0xtoken';

const preparedAction = {
    amount: '10',
    receiptAmount: '9.5',
    unsignedTransaction: '0xunsigned',
};

const buildStore = () => {
    const store = createLightStore({
        reducer: {
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
            wallet: combineReducers({
                settings: createStaticReducer({
                    localCurrency: 'usd',
                    bitcoinAmountUnit: 0,
                }),
                stablecoinYield: yieldReducer,
            }),
        },
    });
    store.dispatch(yieldActions.initSession({ flowType: 'deposit', flowKey: FLOW_KEY }));

    return store;
};

const renderSimulationSheet = ({
    store,
    flowKey = FLOW_KEY,
    onConfirmed = jest.fn(),
    onReportAction = jest.fn(),
}: {
    store: TestStore;
    flowKey?: string | null;
    onConfirmed?: jest.Mock;
    onReportAction?: jest.Mock;
}) =>
    renderHookWithStoreProvider(
        () =>
            useYieldTxSimulationSheet({
                flowKey,
                flowType: 'deposit',
                onConfirmed,
                onReportAction,
            }),
        { store },
    );

describe('useYieldTxSimulationSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('stores the review data and hands off on confirm', async () => {
        const store = buildStore();
        const onConfirmed = jest.fn();
        const onReportAction = jest.fn();
        const { result } = await renderSimulationSheet({ store, onConfirmed, onReportAction });

        await act(() => result.current.openSimulation(preparedAction));
        await act(() => result.current.handleConfirm());

        const session = selectYieldSession(store.getState() as YieldRootState, 'deposit', FLOW_KEY);
        expect(session.action.review).toEqual({
            type: 'deposit',
            amount: '10',
            receiptAmount: '9.5',
            unsignedTransaction: '0xunsigned',
        });
        expect(onReportAction).toHaveBeenCalledWith('continue');
        expect(onConfirmed).toHaveBeenCalled();
    });

    it('only reports on cancel', async () => {
        const store = buildStore();
        const onConfirmed = jest.fn();
        const onReportAction = jest.fn();
        const { result } = await renderSimulationSheet({ store, onConfirmed, onReportAction });

        await act(() => result.current.openSimulation(preparedAction));
        await act(() => result.current.handleCancel());

        const session = selectYieldSession(store.getState() as YieldRootState, 'deposit', FLOW_KEY);
        expect(session.action.review).toBeNull();
        expect(onReportAction).toHaveBeenCalledWith('cancel');
        expect(onConfirmed).not.toHaveBeenCalled();
    });

    it('does nothing on confirm without a flow key', async () => {
        const store = buildStore();
        const onConfirmed = jest.fn();
        const onReportAction = jest.fn();
        const { result } = await renderSimulationSheet({
            store,
            flowKey: null,
            onConfirmed,
            onReportAction,
        });

        await act(() => result.current.openSimulation(preparedAction));
        await act(() => result.current.handleConfirm());

        expect(onReportAction).not.toHaveBeenCalled();
        expect(onConfirmed).not.toHaveBeenCalled();
    });

    // Wait for the animation frame without relying on its timing.
    it('opens the sheet once the prepared action has rendered', async () => {
        const { result } = await renderSimulationSheet({ store: buildStore() });

        await act(() => result.current.openSimulation(preparedAction));

        await waitFor(() => expect(mockOpenModal).toHaveBeenCalled());
    });

    it('does nothing on confirm without a prepared action', async () => {
        const store = buildStore();
        const onConfirmed = jest.fn();
        const onReportAction = jest.fn();
        const { result } = await renderSimulationSheet({ store, onConfirmed, onReportAction });

        await act(() => result.current.handleConfirm());

        const session = selectYieldSession(store.getState() as YieldRootState, 'deposit', FLOW_KEY);
        expect(session.action.review).toBeNull();
        expect(onReportAction).not.toHaveBeenCalled();
        expect(onConfirmed).not.toHaveBeenCalled();
    });
});
