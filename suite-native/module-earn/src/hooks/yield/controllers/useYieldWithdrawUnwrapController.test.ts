import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { deviceAuthorizationInitialState } from '@suite-native/device-authorization';
import { YieldStackRoutes } from '@suite-native/navigation';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldWithdrawUnwrapController } from './useYieldWithdrawUnwrapController';
import { mockYieldWrappedNativeStepResult } from '../../../../mocks/mockYieldWrappedNativeStepResult';
import { useMessageSystemWrappedNative } from '../../earn/useMessageSystemWrappedNative';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldWrappedNativeStep } from '../useYieldWrappedNativeStep';

const mockReplace = jest.fn();
const mockRouteParams: {
    accountKey: string;
    tokenContract: string;
    withdrawFlowType?: 'withdraw' | 'redeem';
} = { accountKey: 'account-key', tokenContract: '0xtoken', withdrawFlowType: 'redeem' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
    useNavigation: () => ({ navigate: jest.fn(), replace: mockReplace }),
    useRoute: () => ({ params: mockRouteParams }),
}));
jest.mock('../useYieldFlowData');
jest.mock('../useYieldWrappedNativeStep');
jest.mock('../../earn/useMessageSystemWrappedNative');

const useYieldFlowDataMock = jest.mocked(useYieldFlowData);
const useYieldWrappedNativeStepMock = jest.mocked(useYieldWrappedNativeStep);
const useMessageSystemWrappedNativeMock = jest.mocked(useMessageSystemWrappedNative);

const resolvedYieldFlowData = mockResolvedYieldFlowData();

const buildUnwrapStep = (
    overrides: Partial<ReturnType<typeof mockYieldWrappedNativeStepResult>> = {},
) =>
    mockYieldWrappedNativeStepResult({
        session: mockYieldSessionState({ step: 'unwrap' }),
        ...overrides,
    });

const renderUnwrapController = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };

    const view = await renderHookWithStoreProvider(useYieldWithdrawUnwrapController, {
        services,
        preloadedState: {
            deviceAuthorization: deviceAuthorizationInitialState,
            device: { selectedDevice: { connected: true } },
        },
    });

    return { ...view, analytics: services.analytics };
};

describe('useYieldWithdrawUnwrapController', () => {
    it.each(['withdraw', 'redeem'] as const)(
        'attributes an unwrap compose error to %s',
        async operation => {
            mockRouteParams.withdrawFlowType = operation;
            const { analytics } = await renderUnwrapController();

            await act(() =>
                useYieldWrappedNativeStepMock.mock.calls
                    .at(-1)?.[0]
                    .onComposeError('fee-estimation-failed'),
            );

            expect(analytics.report).toHaveBeenCalledWith({
                type: 'yield/withdraw',
                payload: {
                    type: 'error',
                    action: 'continue',
                    operation,
                    networkSymbol: resolvedYieldFlowData.account.symbol,
                    vaultId: resolvedYieldFlowData.vault.id,
                    errorMessage: 'unwrap-fee-estimation-failed',
                },
            });
        },
    );

    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteParams.withdrawFlowType = 'redeem';
        useYieldFlowDataMock.mockReturnValue(resolvedYieldFlowData);
        useYieldWrappedNativeStepMock.mockReturnValue(buildUnwrapStep());
        useMessageSystemWrappedNativeMock.mockReturnValue({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        } as ReturnType<typeof useMessageSystemWrappedNative>);
    });

    it.each([
        { operation: 'withdraw', action: 'continue' },
        { operation: 'withdraw', action: 'cancel' },
        { operation: 'redeem', action: 'continue' },
        { operation: 'redeem', action: 'cancel' },
    ] as const)(
        'reports an unwrap simulation decision ($operation, $action)',
        async ({ operation, action }) => {
            mockRouteParams.withdrawFlowType = operation;
            const step = buildUnwrapStep();
            step.simulation.preparedTx = {
                amount: '1',
                unsignedTransaction: 'prepared-transaction',
            };
            useYieldWrappedNativeStepMock.mockReturnValue(step);
            const { result, analytics } = await renderUnwrapController();

            if (result.current.status !== 'ready' || !result.current.simulationSheet) {
                throw new Error('Simulation sheet is not ready');
            }
            const sheet = result.current.simulationSheet;
            await act(() => sheet[action === 'continue' ? 'onConfirm' : 'onCancel']());

            expect(analytics.report).toHaveBeenCalledWith({
                type: 'yield/withdraw',
                payload: {
                    action,
                    type: 'tx-simulation-modal',
                    operation,
                    networkSymbol: resolvedYieldFlowData.account.symbol,
                    vaultId: resolvedYieldFlowData.vault.id,
                },
            });
            expect(
                step.simulation[
                    action === 'continue' ? 'handleConfirmSimulation' : 'handleCancelSimulation'
                ],
            ).toHaveBeenCalledTimes(1);
        },
    );

    it('reports loading for a vault that is not wrapped-native', async () => {
        useYieldFlowDataMock.mockReturnValue({
            ...resolvedYieldFlowData,
            isWrappedNativeVault: false,
        } as ResolvedYieldFlowData);

        const { result } = await renderUnwrapController();

        expect(result.current.status).toBe('loading');
    });

    it('builds the pending modal from the retained pending transaction', async () => {
        const step = buildUnwrapStep();
        useYieldWrappedNativeStepMock.mockReturnValue(step);

        const { result } = await renderUnwrapController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.pendingModal?.pendingTransaction).toBe(
            step.displayedPendingTransaction,
        );
        expect(result.current.pendingModal?.pendingTransaction).not.toBe(step.pendingTransaction);
    });

    it('replaces the screen with the withdraw step carrying the flow type', async () => {
        useYieldWrappedNativeStepMock.mockReturnValue(
            buildUnwrapStep({ session: mockYieldSessionState({ step: 'action' }) }),
        );

        await renderUnwrapController();

        expect(mockReplace).toHaveBeenCalledWith(YieldStackRoutes.YieldWithdraw, {
            ...mockRouteParams,
            withdrawFlowType: 'redeem',
        });
    });

    it('defers the step navigation while the pending sheet is dismissing', async () => {
        useYieldWrappedNativeStepMock.mockReturnValue(
            buildUnwrapStep({
                isSheetPresented: true,
                session: mockYieldSessionState({ step: 'complete' }),
            }),
        );

        await renderUnwrapController();

        expect(mockReplace).not.toHaveBeenCalled();
    });
});
