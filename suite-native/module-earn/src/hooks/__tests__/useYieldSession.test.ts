import { stablecoinYieldActions } from '@suite-common/wallet-core';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useYieldSession } from '../useYieldSession';

const mockDispatch = jest.fn();
let mockSession: { action: { pendingTransaction: object | null } } | null;

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: () => mockSession,
}));

jest.mock('@suite-common/wallet-core', () => ({
    selectStablecoinYieldSessionByFlowKey: jest.fn(),
    stablecoinYieldActions: {
        disposeSession: jest.fn((payload: unknown) => ({ type: 'dispose-session', payload })),
        initSession: jest.fn((payload: unknown) => ({ type: 'init-session', payload })),
    },
}));

jest.mock('@suite-native/navigation', () => ({
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);

const getInterceptorProps = () => mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

const renderUseYieldSession = ({
    flowKey = 'flow-key',
    shouldDisposeOnGoBack = true,
}: {
    flowKey?: string | null;
    shouldDisposeOnGoBack?: boolean;
} = {}) =>
    renderHookWithBasicProvider(() =>
        useYieldSession({
            flowKey,
            flowType: 'deposit',
            shouldDisposeOnGoBack,
        }),
    );

describe('useYieldSession', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSession = { action: { pendingTransaction: null } };
    });

    it.each(['GO_BACK', 'POP'] as const)('disposes the session for %s navigation', actionType => {
        renderUseYieldSession();

        getInterceptorProps()?.onPassThroughAction?.({ type: actionType });

        expect(getInterceptorProps()).toEqual(
            expect.objectContaining({
                isEnabled: true,
                actionTypesToIntercept: [],
            }),
        );
        expect(mockDispatch).toHaveBeenCalledWith(
            stablecoinYieldActions.disposeSession({
                flowType: 'deposit',
                flowKey: 'flow-key',
            }),
        );
    });

    it('does not dispose the session for other removal actions', () => {
        renderUseYieldSession();

        getInterceptorProps()?.onPassThroughAction?.({ type: 'REPLACE' });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('disables removal handling while a transaction is pending', () => {
        mockSession = { action: { pendingTransaction: {} } };

        renderUseYieldSession();

        expect(getInterceptorProps()?.isEnabled).toBe(false);
    });

    it('disables removal handling when disposal was not requested', () => {
        renderUseYieldSession({ shouldDisposeOnGoBack: false });

        expect(getInterceptorProps()?.isEnabled).toBe(false);
    });

    it('disables removal handling without a flow key', () => {
        renderUseYieldSession({ flowKey: null });

        expect(getInterceptorProps()?.isEnabled).toBe(false);
    });
});
