import { createElement } from 'react';

import { combineReducers } from '@reduxjs/toolkit';

import { messageSystemInitialState } from '@suite-common/message-system';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { toTokenAddress } from '@suite-common/wallet-types';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationReducer } from '@suite-native/device-authorization';
import { type YieldFlowParams, YieldStackRoutes } from '@suite-native/navigation';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
    renderWithStoreProvider,
} from '@suite-native/test-utils-store';
import { FeeSelector } from '@suite-native/transaction-management';

import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { useYieldWithdrawController } from './useYieldWithdrawController';
import { mockYieldFlowScreenBaseResult } from '../../../../mocks/mockYieldFlowScreenBaseResult';
import { YieldWithdrawScreen } from '../../../screens/yield/YieldWithdrawScreen';
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
jest.mock('./useYieldWithdrawController', () => {
    const actual = jest.requireActual('./useYieldWithdrawController');

    return { ...actual, useYieldWithdrawController: jest.fn(actual.useYieldWithdrawController) };
});
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
    FeeSelector: jest.fn(() => null),
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
            deviceAuthorization: deviceAuthorizationReducer,
            device: createStaticReducer({ selectedDevice: { connected: true } }),
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

    return renderHookWithStoreProvider(useYieldWithdrawController, {
        services: { ...services, store },
    }).then(view => ({ ...view, services }));
};

describe('useYieldWithdrawController', () => {
    it.each(['withdraw', 'redeem'] as const)(
        'reports the classified compose failure for %s',
        async operation => {
            mockRouteParams.withdrawFlowType = operation;
            const { services } = await renderWithdrawController();

            await act(() =>
                useYieldWithdrawFeesMock.mock.calls
                    .at(-1)?.[0]
                    .onComposeError?.('missing-vault-address'),
            );

            expect(services.analytics.report).toHaveBeenCalledWith({
                type: 'yield/withdraw',
                payload: {
                    type: 'error',
                    action: 'continue',
                    operation,
                    networkSymbol: yieldFlowData.account.symbol,
                    vaultId: yieldFlowData.vault.id,
                    errorMessage: 'missing-vault-address',
                },
            });
        },
    );

    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams = { accountKey: yieldFlowData.account.key, tokenContract };
        useYieldFlowScreenBaseMock.mockReturnValue(
            mockYieldFlowScreenBaseResult({ session: null, yieldFlowData }),
        );
        useYieldWithdrawFeesMock.mockReturnValue(withdrawFees);
        useYieldPendingSheetMock.mockReturnValue(pendingSheet);
    });

    it('forwards the withdrawal Custom builder to the fee picker', async () => {
        const getCustomFeeLevel = jest.fn();
        useYieldWithdrawFeesMock.mockReturnValue({
            ...withdrawFees,
            formDraft: { selectedFee: 'normal' } as NonNullable<typeof withdrawFees.formDraft>,
            getCustomFeeLevel,
        });
        const { result } = await renderWithdrawController();
        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.feeSelector?.getCustomFeeLevel).toBe(getCustomFeeLevel);
        jest.mocked(useYieldWithdrawController).mockReturnValue(result.current);
        try {
            await renderWithStoreProvider(createElement(YieldWithdrawScreen), {
                services: { analytics: mockNativeAnalytics(), networks: mockNetworksServices() },
                preloadedState: { messageSystem: messageSystemInitialState },
            });
            expect(FeeSelector).toHaveBeenCalledWith(
                expect.objectContaining({ getCustomFeeLevel }),
                undefined,
            );
        } finally {
            jest.mocked(useYieldWithdrawController).mockImplementation(
                jest.requireActual('./useYieldWithdrawController').useYieldWithdrawController,
            );
        }
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
