import { combineReducers } from '@reduxjs/toolkit';

import { yieldActions } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import {
    act,
    createLightStore,
    createStaticReducer,
    renderHookWithStoreProvider,
} from '@suite-native/test-utils-store';

import { useYieldDepositController } from './useYieldDepositController';
import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { mockYieldFlowScreenBaseResult } from '../../../../mocks/mockYieldFlowScreenBaseResult';
import { mockYieldPendingTransactionResult } from '../../../../mocks/mockYieldPendingTransactionResult';
import { useYieldDepositFees } from '../useYieldDepositFees';
import { useYieldDepositForm } from '../useYieldDepositForm';
import { useYieldPendingTransaction } from '../useYieldPendingTransaction';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn(), dispatch: jest.fn() }),
    useRoute: () => ({ params: { accountKey: 'account-key', tokenContract: '0xtoken' } }),
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigateToInitialScreen: () => jest.fn(),
}));
jest.mock('./useYieldFlowScreenBase');
jest.mock('../useYieldPendingTransaction');
jest.mock('../useYieldDepositForm');
jest.mock('../useYieldDepositFees');
const mockHandleSubmitDeposit = jest.fn();
jest.mock('../useYieldDepositSubmit', () => ({
    useYieldDepositSubmit: () => ({ handleSubmitDeposit: mockHandleSubmitDeposit }),
}));
jest.mock('../useYieldPendingTransactionTracking', () => ({
    useYieldPendingTransactionTracking: jest.fn(),
}));
jest.mock('../useRefreshYieldDepositAllowanceOnIdle', () => ({
    useRefreshYieldDepositAllowanceOnIdle: jest.fn(),
}));
jest.mock('../useReturnToYieldDepositWrapStep', () => ({
    useReturnToYieldDepositWrapStep: () => jest.fn(),
}));
jest.mock('../../earn/useNavigateBackAnalytics', () => ({
    useNavigateBackAnalytics: jest.fn(),
}));

const useYieldFlowScreenBaseMock = jest.mocked(useYieldFlowScreenBase);
const useYieldPendingTransactionMock = jest.mocked(useYieldPendingTransaction);
const useYieldDepositFormMock = jest.mocked(useYieldDepositForm);
const useYieldDepositFeesMock = jest.mocked(useYieldDepositFees);

const resolvedYieldFlowData = mockResolvedYieldFlowData({ isWrappedNativeVault: false });

type ScreenBase = ReturnType<typeof useYieldFlowScreenBase>;

const buildSession = (step: 'approve' | 'action') =>
    mockYieldSessionState({
        step,
        approval: { allowanceAmount: '10', allowanceStatus: 'loaded' },
    });

const buildScreenBase = (overrides: Partial<ScreenBase> = {}): ScreenBase =>
    mockYieldFlowScreenBaseResult({
        session: buildSession('action'),
        yieldFlowData: resolvedYieldFlowData,
        ...overrides,
    });

const buildDepositForm = (amountValue: string) =>
    ({
        amountValue,
        availableBalance: '25',
        form: { formState: { isValid: true } },
        handleMaxPress: jest.fn(),
    }) as unknown as ReturnType<typeof useYieldDepositForm>;

const renderDepositController = () => {
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

    // The spy must be in place before the render — useDispatch captures store.dispatch then.
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    return renderHookWithStoreProvider(useYieldDepositController, { store, services }).then(
        view => ({ ...view, services, dispatchSpy }),
    );
};

describe('useYieldDepositController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useYieldFlowScreenBaseMock.mockReturnValue(buildScreenBase());
        useYieldPendingTransactionMock.mockReturnValue(mockYieldPendingTransactionResult());
        useYieldDepositFormMock.mockReturnValue(buildDepositForm('5'));
        useYieldDepositFeesMock.mockReturnValue({
            isDepositFeeReady: true,
            isPreparingDepositFee: false,
            preparedAction: null,
        } as unknown as ReturnType<typeof useYieldDepositFees>);
    });

    it('reports loading until the session reaches the action step', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({ session: buildSession('approve') }),
        );

        const { result } = await renderDepositController();

        expect(result.current.status).toBe('loading');
    });

    it('enables the submit with a covered amount and a ready fee', async () => {
        const { result } = await renderDepositController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.footer.isDisabled).toBe(false);
        expect(result.current.isApprovalInsufficient).toBe(false);
    });

    it('blocks the submit when the amount exceeds the allowance', async () => {
        useYieldDepositFormMock.mockReturnValue(buildDepositForm('15'));

        const { result } = await renderDepositController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.isApprovalInsufficient).toBe(true);
        expect(result.current.footer.isDisabled).toBe(true);
        expect(result.current.feeSection.isVisible).toBe(false);
    });

    it('does not submit or report when the continue is disabled', async () => {
        useYieldDepositFeesMock.mockReturnValue({
            isDepositFeeReady: false,
            isPreparingDepositFee: false,
            preparedAction: null,
        } as unknown as ReturnType<typeof useYieldDepositFees>);

        const { result, services } = await renderDepositController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        expect(controller.footer.isDisabled).toBe(true);
        await act(() => controller.footer.onContinue());

        expect(mockHandleSubmitDeposit).not.toHaveBeenCalled();
        expect(services.analytics.report).not.toHaveBeenCalled();
    });

    it('disposes the session on close', async () => {
        const { result, dispatchSpy } = await renderDepositController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.header.onClose());

        expect(dispatchSpy).toHaveBeenCalledWith(
            yieldActions.disposeSession({ flowType: 'deposit', flowKey: 'flow-key' }),
        );
    });

    it('keeps the session on close while a transaction is pending', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({
                session: mockYieldSessionState({
                    step: 'action',
                    approval: { allowanceAmount: '10', allowanceStatus: 'loaded' },
                    action: {
                        pendingTransaction: { type: 'deposit', txid: '0xtxid', amount: '5' },
                    },
                }),
            }),
        );

        const { result, dispatchSpy } = await renderDepositController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.header.onClose());

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            yieldActions.disposeSession({ flowType: 'deposit', flowKey: 'flow-key' }),
        );
    });

    it('blocks the submit when the deposit is disabled by the message system', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({
                messageSystem: {
                    isDisabled: true,
                    content: 'off',
                    variant: 'warning',
                } as ScreenBase['messageSystem'],
            }),
        );

        const { result } = await renderDepositController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.footer.isDisabled).toBe(true);
        expect(result.current.disabledAlert).toEqual({ content: 'off', variant: 'warning' });
    });
});
