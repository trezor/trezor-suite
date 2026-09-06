import { type ResolvedYieldFlowData } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { YieldStackRoutes } from '@suite-native/navigation';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useYieldDepositWrapController } from './useYieldDepositWrapController';
import { mockYieldWrappedNativeStepResult } from '../../../../mocks/mockYieldWrappedNativeStepResult';
import { useMessageSystemWrappedNative } from '../../earn/useMessageSystemWrappedNative';
import { useMessageSystemYield } from '../useMessageSystemYield';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldWrappedNativeStep } from '../useYieldWrappedNativeStep';

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
jest.mock('../../earn/useMessageSystemWrappedNative');

const useYieldFlowDataMock = jest.mocked(useYieldFlowData);
const useYieldWrappedNativeStepMock = jest.mocked(useYieldWrappedNativeStep);
const useMessageSystemYieldMock = jest.mocked(useMessageSystemYield);
const useMessageSystemWrappedNativeMock = jest.mocked(useMessageSystemWrappedNative);

const resolvedYieldFlowData = mockResolvedYieldFlowData();

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
