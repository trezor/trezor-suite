import { useFocusEffect } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { type AnalyticsNativeEvents, type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { useNavigateBackAnalytics } from './useNavigateBackAnalytics';

type BeforeRemoveEvent = { data: { action: { type: string } } };
const mockNavigation = {
    addListener: mock<(name: string, listener: (event: BeforeRemoveEvent) => void) => () => void>(),
    isFocused: jest.fn(() => true),
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
    useFocusEffect: jest.fn(),
}));

const event = {
    type: events.yieldNavigateEvent.name,
    payload: { action: 'cancel', from: 'deposit-form', to: 'deposit-form' },
} as const satisfies AnalyticsNativeEvents;

const renderBackAnalytics = async (isEnabled = true) => {
    const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics(jest.fn()) };
    const view = await renderHookWithBasicProvider(
        (enabled: boolean) => useNavigateBackAnalytics(event, enabled),
        {
            initialProps: isEnabled,
            services,
        },
    );
    const listener = mockNavigation.addListener.mock.calls[0]?.[1];
    if (!listener) throw new Error('Missing beforeRemove listener');

    const remove = async (type: string) => {
        await act(() => listener({ data: { action: { type } } }));
    };

    return { ...view, analytics: services.analytics, remove };
};

describe('useNavigateBackAnalytics', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNavigation.isFocused.mockReturnValue(true);
        mockNavigation.addListener.mockReturnValue(jest.fn());
    });

    it.each(['GO_BACK', 'POP', 'POP_TO_TOP'])(
        'reports an active screen removed by %s',
        async type => {
            const { analytics, remove } = await renderBackAnalytics();
            await remove(type);
            expect(analytics.report).toHaveBeenCalledTimes(1);
            expect(analytics.report).toHaveBeenCalledWith(event);
        },
    );

    it.each(['GO_BACK', 'POP', 'POP_TO_TOP'])(
        'does not cancel a background screen removed by %s',
        async type => {
            mockNavigation.isFocused.mockReturnValue(false);
            const { analytics, remove } = await renderBackAnalytics();
            await remove(type);
            expect(analytics.report).not.toHaveBeenCalled();
        },
    );

    it('does not cancel a screen that continued', async () => {
        const { analytics, remove, result } = await renderBackAnalytics();
        await act(() => result.current());
        await remove('POP_TO_TOP');
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('does not report cancellation for an info-only screen', async () => {
        const { analytics, remove } = await renderBackAnalytics(false);
        await remove('GO_BACK');
        expect(analytics.report).not.toHaveBeenCalled();
    });

    it('starts tracking again when the screen regains focus', async () => {
        const { analytics, remove, result } = await renderBackAnalytics();
        await act(() => result.current());
        const onFocus = jest.mocked(useFocusEffect).mock.calls.at(-1)?.[0];
        if (!onFocus) throw new Error('Missing focus callback');
        await act(() => onFocus());
        await remove('GO_BACK');
        expect(analytics.report).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith(event);
    });

    it.each(['REPLACE', 'RESET'])('does not interpret %s as user cancellation', async type => {
        const { analytics, remove } = await renderBackAnalytics();
        await remove(type);
        expect(analytics.report).not.toHaveBeenCalled();
    });
});
