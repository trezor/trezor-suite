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

import { useYieldDepositApprovalController } from './useYieldDepositApprovalController';
import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { mockYieldFlowScreenBaseResult } from '../../../../mocks/mockYieldFlowScreenBaseResult';
import { mockYieldPendingTransactionResult } from '../../../../mocks/mockYieldPendingTransactionResult';
import { useYieldApprovalFees } from '../useYieldApprovalFees';
import { useYieldDepositForm } from '../useYieldDepositForm';
import { useYieldPendingTransaction } from '../useYieldPendingTransaction';

let mockNavigationRoutes: unknown[];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: jest.fn(),
        getState: () => ({ routes: mockNavigationRoutes }),
    }),
    useRoute: () => ({ params: { accountKey: 'account-key', tokenContract: '0xtoken' } }),
}));
jest.mock('@suite-native/navigation', () => ({
    ...jest.requireActual('@suite-native/navigation'),
    useNavigateToInitialScreen: () => jest.fn(),
}));
jest.mock('./useYieldFlowScreenBase');
jest.mock('../useYieldPendingTransaction');
jest.mock('../useYieldDepositForm');
jest.mock('../useYieldApprovalFees');
const mockHandleSubmitApproval = jest.fn();
jest.mock('../useYieldDepositApprovalSubmit', () => ({
    useYieldDepositApprovalSubmit: () => ({
        handleSubmitApproval: mockHandleSubmitApproval,
        isCheckingApproval: false,
    }),
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

const useYieldFlowScreenBaseMock = jest.mocked(useYieldFlowScreenBase);
const useYieldPendingTransactionMock = jest.mocked(useYieldPendingTransaction);
const useYieldDepositFormMock = jest.mocked(useYieldDepositForm);
const useYieldApprovalFeesMock = jest.mocked(useYieldApprovalFees);

const resolvedYieldFlowData = mockResolvedYieldFlowData({ isWrappedNativeVault: false });

type ScreenBase = ReturnType<typeof useYieldFlowScreenBase>;

const buildSession = (step: 'approve' | 'action', isRevokeRequired = false) =>
    mockYieldSessionState({
        step,
        approval: { allowanceAmount: '10', allowanceStatus: 'loaded', isRevokeRequired },
    });

const buildScreenBase = (overrides: Partial<ScreenBase> = {}): ScreenBase =>
    mockYieldFlowScreenBaseResult({
        session: buildSession('approve'),
        yieldFlowData: resolvedYieldFlowData,
        ...overrides,
    });

const renderApprovalController = () => {
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

    return renderHookWithStoreProvider(useYieldDepositApprovalController, {
        store,
        services,
    }).then(view => ({ ...view, services, dispatchSpy }));
};

describe('useYieldDepositApprovalController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigationRoutes = [{}];
        useYieldFlowScreenBaseMock.mockReturnValue(buildScreenBase());
        useYieldPendingTransactionMock.mockReturnValue(mockYieldPendingTransactionResult());
        useYieldDepositFormMock.mockReturnValue({
            amountValue: '5',
            availableBalance: '25',
            form: {
                formState: { isValid: true },
                handleSubmit: (onValid: (values: { amount: string }) => unknown) => () =>
                    onValid({ amount: '5' }),
            },
            handleMaxPress: jest.fn(),
        } as unknown as ReturnType<typeof useYieldDepositForm>);
        useYieldApprovalFeesMock.mockReturnValue({
            formDraft: null,
            formDraftKey: '',
            isAllowanceFeeReady: true,
            selectedFee: undefined,
            updateFeeLevelThunk: jest.fn(),
        } as unknown as ReturnType<typeof useYieldApprovalFees>);
    });

    it('is ready once the flow data resolves, even without a session', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(buildScreenBase({ session: null }));

        const { result } = await renderApprovalController();

        expect(result.current.status).toBe('ready');
    });

    it('offers the skip only while the approve step shows an approved amount', async () => {
        const { result } = await renderApprovalController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.footer.onSkipPress).toBeDefined();
        expect(result.current.footer.isDisabled).toBe(false);
    });

    it('disables the skip and submit once the session moved past the approve step', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({ session: buildSession('action') }),
        );

        const { result } = await renderApprovalController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.footer.onSkipPress).toBeUndefined();
        expect(result.current.footer.isDisabled).toBe(true);
    });

    it('does not submit or report when the submit is disabled', async () => {
        useYieldApprovalFeesMock.mockReturnValue({
            formDraft: null,
            formDraftKey: '',
            isAllowanceFeeReady: false,
            selectedFee: undefined,
            updateFeeLevelThunk: jest.fn(),
        } as unknown as ReturnType<typeof useYieldApprovalFees>);

        const { result, services } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        expect(controller.footer.isDisabled).toBe(true);
        await act(() => controller.footer.onPress());

        expect(mockHandleSubmitApproval).not.toHaveBeenCalled();
        expect(services.analytics.report).not.toHaveBeenCalled();
    });

    it('disposes the session on close once popping removes the screen', async () => {
        mockNavigationRoutes = [{}, {}];

        const { result, dispatchSpy } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.header.onClose());

        expect(dispatchSpy).toHaveBeenCalledWith(
            yieldActions.disposeSession({ flowType: 'deposit', flowKey: 'flow-key' }),
        );
    });

    it('keeps the session on close when the approval is the only route', async () => {
        const { result, dispatchSpy } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.header.onClose());

        expect(dispatchSpy).not.toHaveBeenCalledWith(
            yieldActions.disposeSession({ flowType: 'deposit', flowKey: 'flow-key' }),
        );
    });

    it('surfaces the required revoke in the footer action and warning', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({ session: buildSession('approve', true) }),
        );

        const { result } = await renderApprovalController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.footer.approvalAction).toBe('revoke');
        expect(result.current.isRevokeRequired).toBe(true);
    });
});
