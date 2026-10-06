import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { YieldStackRoutes } from '@suite-native/navigation';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { mockYieldWrappedNativeStepResult } from '../../../../mocks/mockYieldWrappedNativeStepResult';
import { useMessageSystemWrappedNative } from '../../earn/useMessageSystemWrappedNative';
import { useMessageSystemYield } from '../useMessageSystemYield';
import { useYieldDepositGasReserve } from '../useYieldDepositGasReserve';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldWrappedNativeStep } from '../useYieldWrappedNativeStep';
import { useYieldDepositWrapController } from './useYieldDepositWrapController';

const mockReplace = jest.fn();
const mockRouteParams = { accountKey: 'account-key', tokenContract: '0xtoken' };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
    useNavigation: () => ({ navigate: jest.fn(), replace: mockReplace }),
    useRoute: () => ({ params: mockRouteParams }),
}));
jest.mock('../useYieldFlowData');
jest.mock('../useYieldWrappedNativeStep');
jest.mock('../useMessageSystemYield');
jest.mock('../useYieldDepositGasReserve');
jest.mock('../../earn/useMessageSystemWrappedNative');

const useYieldFlowDataMock = jest.mocked(useYieldFlowData);
const useYieldWrappedNativeStepMock = jest.mocked(useYieldWrappedNativeStep);
const useMessageSystemYieldMock = jest.mocked(useMessageSystemYield);
const useYieldDepositGasReserveMock = jest.mocked(useYieldDepositGasReserve);
const useMessageSystemWrappedNativeMock = jest.mocked(useMessageSystemWrappedNative);

const GAS_RESERVE = { minimum: '0.002', recommended: '0.005' };

const buildFlowData = (formattedBalance: string) =>
    mockResolvedYieldFlowData({
        account: mockWalletAccount({ symbol: asNetworkSymbol('eth'), formattedBalance }),
    });

const resolvedYieldFlowData = buildFlowData('0.2');

const enabledMessageSystem = { isDisabled: false, content: undefined, variant: undefined };

const renderWrapController = async () => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const view = await renderHookWithStoreProvider(useYieldDepositWrapController, { services });

    return view;
};

describe('useYieldDepositWrapController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useYieldFlowDataMock.mockReturnValue(resolvedYieldFlowData);
        useYieldWrappedNativeStepMock.mockReturnValue(mockYieldWrappedNativeStepResult());
        useYieldDepositGasReserveMock.mockReturnValue(GAS_RESERVE);
        useMessageSystemYieldMock.mockReturnValue(
            enabledMessageSystem as ReturnType<typeof useMessageSystemYield>,
        );
        useMessageSystemWrappedNativeMock.mockReturnValue(
            enabledMessageSystem as ReturnType<typeof useMessageSystemWrappedNative>,
        );
    });

    it('reports loading for a vault that is not wrapped-native', async () => {
        useYieldFlowDataMock.mockReturnValue({
            ...resolvedYieldFlowData,
            isWrappedNativeVault: false,
        } as ResolvedYieldFlowData);

        const { result } = await renderWrapController();

        expect(result.current.status).toBe('loading');
    });

    it('builds the pending modal from the live pending transaction, not the retained one', async () => {
        const step = mockYieldWrappedNativeStepResult();
        useYieldWrappedNativeStepMock.mockReturnValue(step);

        const { result } = await renderWrapController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.pendingModal?.pendingTransaction).toBe(step.pendingTransaction);
        expect(result.current.pendingModal?.pendingTransaction).not.toBe(
            step.displayedPendingTransaction,
        );
    });

    it('freezes the reserve into the deposit session', async () => {
        await renderWrapController();

        expect(useYieldDepositGasReserveMock).toHaveBeenCalledWith({
            account: resolvedYieldFlowData.account,
            isWrappedNativeVault: true,
            tokenContractAddress: resolvedYieldFlowData.token.contractAddress,
            flowKey: resolvedYieldFlowData.flowKey,
        });
    });

    it('offers the balance minus the recommended reserve as Max and confirms the reserve kept', async () => {
        useYieldWrappedNativeStepMock.mockReturnValue(
            mockYieldWrappedNativeStepResult({ amountValue: '0.195', isStepPending: false }),
        );

        const { result } = await renderWrapController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.amountInput.balance).toBe('0.2');
        expect(result.current.amountInput.maxAmount).toBe('0.195');
        expect(result.current.amountInput.isDisabled).toBe(false);
        expect(result.current.feeReserve).toEqual({
            amount: '0.005',
            isInsufficient: false,
            wrapStatus: 'kept',
        });
        expect(result.current.footer.isSubmitDisabled).toBe(false);
    });

    it('recommends the reserve when the amount eats into it', async () => {
        useYieldWrappedNativeStepMock.mockReturnValue(
            mockYieldWrappedNativeStepResult({ amountValue: '0.199', isStepPending: false }),
        );

        const { result } = await renderWrapController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.feeReserve.wrapStatus).toBe('below');
        expect(result.current.footer.isSubmitDisabled).toBe(false);
    });

    it('blocks the wrap while the balance does not exceed the recommended reserve', async () => {
        useYieldFlowDataMock.mockReturnValue(buildFlowData('0.005'));
        useYieldWrappedNativeStepMock.mockReturnValue(
            mockYieldWrappedNativeStepResult({ amountValue: '', isStepPending: false }),
        );

        const { result } = await renderWrapController();

        if (result.current.status !== 'ready') throw new Error('not ready');
        expect(result.current.amountInput.maxAmount).toBe('0');
        expect(result.current.amountInput.isDisabled).toBe(true);
        expect(result.current.feeReserve.isInsufficient).toBe(true);
        expect(result.current.footer.isSubmitDisabled).toBe(true);
    });

    it('replaces the screen with the approval once the wrap step resolves', async () => {
        useYieldWrappedNativeStepMock.mockReturnValue(
            mockYieldWrappedNativeStepResult({
                session: mockYieldSessionState({ step: 'approve' }),
            }),
        );

        await renderWrapController();

        expect(mockReplace).toHaveBeenCalledWith(
            YieldStackRoutes.YieldDepositApproval,
            mockRouteParams,
        );
    });
});
