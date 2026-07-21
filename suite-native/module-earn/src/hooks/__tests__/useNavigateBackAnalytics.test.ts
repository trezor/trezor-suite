import { type NavigationAction } from '@react-navigation/native';

import { type AnalyticsNativeEvents, events } from '@suite-native/analytics';
import { useNavigationRemoveActionInterceptor } from '@suite-native/navigation';
import { renderHook } from '@suite-native/test-utils';

import { useNavigateBackAnalytics } from '../useNavigateBackAnalytics';

const mockReport = jest.fn();

jest.mock('@suite-common/dependency-injection', () => ({
    useServices: () => ({ analytics: { report: mockReport } }),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => void) => callback(),
}));

jest.mock('@suite-native/navigation', () => ({
    useNavigationRemoveActionInterceptor: jest.fn(),
}));

const mockedUseNavigationRemoveActionInterceptor = jest.mocked(
    useNavigationRemoveActionInterceptor,
);

const getInterceptorProps = () => mockedUseNavigationRemoveActionInterceptor.mock.calls.at(-1)?.[0];

const event: AnalyticsNativeEvents = {
    type: events.stakingStakeEvent.name,
    payload: {
        action: 'cancel',
        step: 'stake-form-modal',
    },
};

describe('useNavigateBackAnalytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(['GO_BACK', 'POP'] as const)('reports analytics for %s navigation', actionType => {
        renderHook(() => useNavigateBackAnalytics(event));

        getInterceptorProps()?.onPassThroughAction?.({ type: actionType });

        expect(getInterceptorProps()?.actionTypesToIntercept).toEqual([]);
        expect(mockReport).toHaveBeenCalledWith(event);
        expect(mockReport).toHaveBeenCalledTimes(1);
    });

    it('does not report analytics for other removal actions', () => {
        renderHook(() => useNavigateBackAnalytics(event));

        getInterceptorProps()?.onPassThroughAction?.({ type: 'REPLACE' } as NavigationAction);

        expect(mockReport).not.toHaveBeenCalled();
    });

    it.each(['GO_BACK', 'POP'] as const)(
        'does not report %s navigation after the flow continued',
        actionType => {
            const { result } = renderHook(() => useNavigateBackAnalytics(event));

            result.current();
            getInterceptorProps()?.onPassThroughAction?.({ type: actionType });

            expect(mockReport).not.toHaveBeenCalled();
        },
    );
});
