import { combineReducers } from '@reduxjs/toolkit';

import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { toTokenAddress } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type YieldFlowParams, YieldStackRoutes } from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { useYieldWithdrawController } from './useYieldWithdrawController';
import { mockYieldFlowScreenBaseResult } from '../../../../mocks/mockYieldFlowScreenBaseResult';
import { useYieldPendingSheet } from '../useYieldPendingSheet';
import { useYieldWithdrawFees } from '../useYieldWithdrawFees';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
let mockRouteParams: YieldFlowParams & { withdrawFlowType?: 'withdraw' | 'redeem' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate, replace: mockReplace, goBack: jest.fn() }),
    useRoute: () => ({ params: mockRouteParams }),
}));
jest.mock('./useYieldFlowScreenBase');
jest.mock('../useYieldWithdrawFees');
jest.mock('../useYieldPendingSheet');
jest.mock('../useYieldPendingTransactionTracking', () => ({
    useYieldPendingTransactionTracking: jest.fn(),
}));
jest.mock('../../earn/useNavigateBackAnalytics', () => ({
    useNavigateBackAnalytics: jest.fn(),
}));
jest.mock('@suite-native/formatters', () => ({
    ...jest.requireActual('@suite-native/formatters'),
    useCryptoFiatConverters: () => null,
}));
jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useTransactionDetails: () => ({ explorerUrl: null, openInBlockchain: jest.fn() }),
}));

const useYieldFlowScreenBaseMock = jest.mocked(useYieldFlowScreenBase);
const useYieldWithdrawFeesMock = jest.mocked(useYieldWithdrawFees);
const useYieldPendingSheetMock = jest.mocked(useYieldPendingSheet);

const yieldFlowData = mockResolvedYieldFlowData();
const tokenContract = toTokenAddress('0xtoken');

// Omit thunk internals from the fee mock.
const withdrawFees = {
    fee: undefined,
    formDraft: null,
    formDraftKey: '',
    hasFeeEstimationError: false,
    isComposingWithdrawFee: false,
    isFeeUnavailable: false,
    preparedAction: null,
    retryFeeEstimation: jest.fn(),
    selectedFee: undefined,
    updateFeeLevelThunk: jest.fn(),
} as unknown as ReturnType<typeof useYieldWithdrawFees>;

const pendingSheet: ReturnType<typeof useYieldPendingSheet> = {
    displayedPendingTransaction: undefined,
    isSheetPresented: false,
    handleSheetDismissed: jest.fn(),
};

const renderWithdrawController = () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const store = createLightStore({
        reducer: {
            locale: createStaticReducer({
                appLocaleCode: 'en-US',
                systemLocaleCode: 'en-US',
                isSystemLocaleUsed: true,
            }),
            wallet: combineReducers({
                settings: createStaticReducer({ localCurrency: 'usd', bitcoinAmountUnit: 0 }),
            }),
        },
    });

    return renderHookWithStoreProvider(useYieldWithdrawController, { store, services }).then(
        view => ({ ...view, services }),
    );
};

describe('useYieldWithdrawController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = { accountKey: yieldFlowData.account.key, tokenContract };
        useYieldFlowScreenBaseMock.mockReturnValue(
            mockYieldFlowScreenBaseResult({ session: null, yieldFlowData }),
        );
        useYieldWithdrawFeesMock.mockReturnValue(withdrawFees);
        useYieldPendingSheetMock.mockReturnValue(pendingSheet);
    });

    it('starts in the flow type carried by the route', async () => {
        mockRouteParams = { ...mockRouteParams, withdrawFlowType: 'redeem' };

        const { result } = await renderWithdrawController();

        expect(result.current.status).toBe('ready');
        if (result.current.status !== 'ready') return;
        expect(result.current.amountForm.isSharesInput).toBe(true);
    });

    it('switches the input unit and reports the toggle', async () => {
        const { result, services } = await renderWithdrawController();

        const initial = result.current;
        if (initial.status !== 'ready') throw new Error('not ready');
        await act(() => initial.amountForm.onInputSwitch('secondary'));

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        expect(controller.amountForm.isSharesInput).toBe(true);
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: {
                element: 'withdraw-unit-toggle',
                value: 'shares',
                networkSymbol: 'eth',
                vaultId: 'vault-id',
            },
        });
    });

    it('fills both amounts and switches to redeem on the max toggle from the asset view', async () => {
        const { result, services } = await renderWithdrawController();

        const initial = result.current;
        if (initial.status !== 'ready') throw new Error('not ready');
        await act(() => initial.amountForm.onMaxChange(true));

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        expect(controller.amountForm.isMaxSelected).toBe(true);
        expect(controller.amountForm.isSharesInput).toBe(true);
        expect(controller.amountForm.assetAmount).toBe('10');
        expect(controller.amountForm.sharesAmount).toBe('4');
        expect(controller.warning.isMaxWithdrawInfoVisible).toBe(true);
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'yield/interaction',
            payload: {
                element: 'withdraw-max',
                value: 'asset',
                networkSymbol: 'eth',
                vaultId: 'vault-id',
            },
        });
    });

    it('clears both amounts when the max toggle is switched off', async () => {
        const { result } = await renderWithdrawController();

        const initial = result.current;
        if (initial.status !== 'ready') throw new Error('not ready');
        await act(() => initial.amountForm.onMaxChange(true));

        const afterMax = result.current;
        if (afterMax.status !== 'ready') throw new Error('not ready');
        await act(() => afterMax.amountForm.onMaxChange(false));

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        expect(controller.amountForm.isMaxSelected).toBe(false);
        expect(controller.amountForm.assetAmount).toBe('');
        expect(controller.amountForm.sharesAmount).toBe('');
        expect(controller.warning.isMaxWithdrawInfoVisible).toBe(false);
    });

    it('replaces the screen with the unwrap step carrying the active flow type', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            mockYieldFlowScreenBaseResult({
                session: mockYieldSessionState({ step: 'unwrap' }),
                yieldFlowData,
            }),
        );
        mockRouteParams = { ...mockRouteParams, withdrawFlowType: 'redeem' };

        await renderWithdrawController();

        expect(mockReplace).toHaveBeenCalledWith(YieldStackRoutes.YieldWithdrawUnwrap, {
            ...mockRouteParams,
            withdrawFlowType: 'redeem',
        });
    });

    it('replaces the screen with the completion once the session finishes', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            mockYieldFlowScreenBaseResult({
                session: mockYieldSessionState({ step: 'complete' }),
                yieldFlowData,
            }),
        );

        await renderWithdrawController();

        expect(mockReplace).toHaveBeenCalledWith(YieldStackRoutes.YieldWithdrawComplete, {
            ...mockRouteParams,
            withdrawFlowType: 'withdraw',
        });
    });

    it('defers the step navigation while the pending sheet is dismissing', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            mockYieldFlowScreenBaseResult({
                session: mockYieldSessionState({ step: 'unwrap' }),
                yieldFlowData,
            }),
        );
        useYieldPendingSheetMock.mockReturnValue({ ...pendingSheet, isSheetPresented: true });

        await renderWithdrawController();

        expect(mockReplace).not.toHaveBeenCalled();
    });
});
