import { Keyboard } from 'react-native';

import { combineReducers } from '@reduxjs/toolkit';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { yieldActions } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationReducer } from '@suite-native/device-authorization';
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
import { YieldFlowExitAnalyticsProvider } from '../../../components/yield/YieldFlowExitAnalyticsProvider';
import { useYieldApprovalFees } from '../useYieldApprovalFees';
import { useYieldDepositForm } from '../useYieldDepositForm';
import { useYieldDepositGasReserve } from '../useYieldDepositGasReserve';
import { useYieldPendingTransaction } from '../useYieldPendingTransaction';

const mockNavigate = jest.fn();
let mockNavigationRoutes: unknown[];
const mockBeforeRemove = jest.fn(
    (_name: string, _listener: (event: { data: { action: { type: string } } }) => void) => () =>
        undefined,
);

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: jest.fn(),
    useNavigation: () => ({
        addListener: mockBeforeRemove,
        getParent: () => ({ addListener: mockBeforeRemove }),
        isFocused: () => true,
        navigate: mockNavigate,
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
jest.mock('../useYieldDepositGasReserve');
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
const useYieldDepositGasReserveMock = jest.mocked(useYieldDepositGasReserve);

const GAS_RESERVE = { minimum: '0.002', recommended: '0.005' };

const buildFlowData = (formattedBalance: string) =>
    mockResolvedYieldFlowData({
        account: mockWalletAccount({ symbol: asNetworkSymbol('eth'), formattedBalance }),
        isWrappedNativeVault: false,
    });
const useYieldApprovalFeesMock = jest.mocked(useYieldApprovalFees);

const resolvedYieldFlowData = buildFlowData('0.2');

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
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };
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

    // The spy must be in place before the render — useDispatch captures store.dispatch then.
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    return renderHookWithStoreProvider(useYieldDepositApprovalController, {
        wrapper: YieldFlowExitAnalyticsProvider,
        services: { ...services, store },
    }).then(view => ({ ...view, services, dispatchSpy }));
};

describe('useYieldDepositApprovalController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigate.mockReset();
        mockHandleSubmitApproval.mockReset();
        jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
        mockNavigationRoutes = [{}];
        useYieldFlowScreenBaseMock.mockReturnValue(buildScreenBase());
        useYieldPendingTransactionMock.mockReturnValue(mockYieldPendingTransactionResult());
        useYieldDepositGasReserveMock.mockReturnValue(GAS_RESERVE);
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
            hasFeeEstimationError: false,
            retryFeeEstimation: jest.fn(),
            isAllowanceFeeReady: true,
            selectedFee: undefined,
            updateFeeLevelThunk: jest.fn(),
        } as unknown as ReturnType<typeof useYieldApprovalFees>);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('dismisses the keyboard before submitting approval', async () => {
        const events: string[] = [];
        jest.mocked(Keyboard.dismiss).mockImplementation(() => {
            events.push('dismiss');
        });
        mockHandleSubmitApproval.mockImplementationOnce(() => events.push('submit'));
        const { result } = await renderApprovalController();
        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');

        await act(() => controller.footer.onPress());

        expect(events).toEqual(['dismiss', 'submit']);
    });

    it.each(['skip', 'revoke'] as const)('dismisses before navigating from %s', async action => {
        const events: string[] = [];
        jest.mocked(Keyboard.dismiss).mockImplementation(() => {
            events.push('dismiss');
        });
        mockNavigate.mockImplementationOnce(() => events.push('navigate'));
        const { result } = await renderApprovalController();
        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        const handler =
            action === 'skip'
                ? controller.footer.onSkipPress
                : controller.approvedAmountCard.onRevoke;
        if (!handler) throw new Error('missing handler');

        await act(() => handler());

        expect(events).toEqual(['dismiss', 'navigate']);
    });

    it('is ready once the flow data resolves, even without a session', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(buildScreenBase({ session: null }));

        const { result } = await renderApprovalController();

        expect(result.current.status).toBe('ready');
    });

    it('pauses approval estimates while another screen owns the fee levels', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(buildScreenBase({ isFocused: false }));

        await renderApprovalController();

        expect(useYieldApprovalFeesMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ isEnabled: false }),
        );
    });

    it('pauses approval estimates while the approval is pending', async () => {
        useYieldPendingTransactionMock.mockReturnValue(
            mockYieldPendingTransactionResult({
                pendingTransaction: { type: 'approve', txid: '0xpending', amount: '5' },
            }),
        );

        await renderApprovalController();

        expect(useYieldApprovalFeesMock).toHaveBeenLastCalledWith(
            expect.objectContaining({ isEnabled: false }),
        );
    });

    it('reports leaving the approval flow while its transaction is pending', async () => {
        useYieldPendingTransactionMock.mockReturnValue(
            mockYieldPendingTransactionResult({
                pendingTransaction: { type: 'approve', txid: '0xpending', amount: '5' },
            }),
        );
        const { services } = await renderApprovalController();
        const listener = mockBeforeRemove.mock.calls.at(-1)?.[1];
        if (!listener) throw new Error('Missing exit listener');
        await act(() => listener({ data: { action: { type: 'POP_TO_TOP' } } }));
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'cancel',
                from: 'deposit-form',
                to: 'earn-dashboard',
                networkSymbol: 'eth',
                vaultId: 'vault-id',
            },
        });
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
            hasFeeEstimationError: false,
            retryFeeEstimation: jest.fn(),
            isAllowanceFeeReady: false,
            selectedFee: undefined,
            updateFeeLevelThunk: jest.fn(),
        } as unknown as ReturnType<typeof useYieldApprovalFees>);

        const { result, services } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        expect(controller.footer.isDisabled).toBe(true);
        await act(() => controller.footer.onPress());

        expect(Keyboard.dismiss).not.toHaveBeenCalled();
        expect(mockHandleSubmitApproval).not.toHaveBeenCalled();
        expect(services.analytics.report).not.toHaveBeenCalled();
    });

    it('freezes the reserve into the deposit session', async () => {
        await renderApprovalController();

        expect(useYieldDepositGasReserveMock).toHaveBeenCalledWith({
            account: resolvedYieldFlowData.account,
            isWrappedNativeVault: false,
            tokenContractAddress: resolvedYieldFlowData.token.contractAddress,
            flowKey: resolvedYieldFlowData.flowKey,
        });
    });

    it('recommends a top-up between the minimum and recommended reserve', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({ yieldFlowData: buildFlowData('0.003') }),
        );

        const { result } = await renderApprovalController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.feeReserveAlert).toEqual({ type: 'top-up', amount: '0.005' });
        expect(result.current.footer.isDisabled).toBe(false);
    });

    it('blocks the approval below the minimum reserve', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({ yieldFlowData: buildFlowData('0.001') }),
        );

        const { result } = await renderApprovalController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.feeReserveAlert).toEqual({ type: 'insufficient', amount: '0.002' });
        expect(result.current.footer.isDisabled).toBe(true);
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

    it('does not report a revoke submit when opening the revoke form from the approved amount', async () => {
        const { result, services } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.approvedAmountCard.onRevoke());

        expect(services.analytics.report).not.toHaveBeenCalled();
    });

    it.each(['onPress', 'onSkipPress'] as const)(
        'reports %s with sufficient allowance as a skip without a device snapshot',
        async handler => {
            const { result, services } = await renderApprovalController();

            const controller = result.current;
            if (controller.status !== 'ready') throw new Error('not ready');
            expect(controller.footer.approvalAction).toBe('continue');
            const onPress = controller.footer[handler];
            if (!onPress) throw new Error('missing approval handler');
            await act(() => onPress());

            expect(services.analytics.report).toHaveBeenCalledTimes(1);
            expect(services.analytics.report).toHaveBeenCalledWith({
                type: 'yield/deposit',
                payload: {
                    action: 'skip',
                    type: 'approve',
                    networkSymbol: resolvedYieldFlowData.account.symbol,
                    vaultId: resolvedYieldFlowData.vault.id,
                },
            });
        },
    );

    it('keeps the device snapshot on an actual approval submit', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({
                session: mockYieldSessionState({
                    step: 'approve',
                    approval: { allowanceStatus: 'loaded', allowanceAmount: '0' },
                }),
            }),
        );
        const { result, services } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.footer.onPress());

        expect(services.analytics.report).toHaveBeenCalledTimes(1);
        expect(services.analytics.report).toHaveBeenCalledWith({
            type: 'yield/deposit',
            payload: expect.objectContaining({
                action: 'continue',
                type: 'approve',
                deviceStatus: 'connected',
            }),
        });
    });

    it('does not report a revoke submit when the approval footer opens the required revoke form', async () => {
        useYieldFlowScreenBaseMock.mockReturnValue(
            buildScreenBase({ session: buildSession('approve', true) }),
        );
        const { result, services } = await renderApprovalController();

        const controller = result.current;
        if (controller.status !== 'ready') throw new Error('not ready');
        await act(() => controller.footer.onPress());

        expect(mockHandleSubmitApproval).toHaveBeenCalledWith('5');
        expect(services.analytics.report).not.toHaveBeenCalled();
    });
});
