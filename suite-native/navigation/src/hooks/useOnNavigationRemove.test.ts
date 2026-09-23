import { type NavigationAction } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { type UseOnNavigationRemoveParams, useOnNavigationRemove } from './useOnNavigationRemove';
import { BACK_NAVIGATION_ACTIONS } from '../navigationRemove';

type RemoveEvent = { data: { action: NavigationAction }; preventDefault: () => void };
const mockUnsubscribe = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn(
    (_name: string, _callback: (event: RemoveEvent) => void) => mockUnsubscribe,
);
const mockNavigation = { addListener: mockAddListener, dispatch: mockDispatch };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

const triggerRemoval = (type: string) => {
    const event = { data: { action: { type } }, preventDefault: jest.fn() };
    mockAddListener.mock.calls.at(-1)?.[1](event);

    return event;
};

describe('useOnNavigationRemove', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('observes all removals by default without preventing or dispatching', async () => {
        const onRemoveAttempt = jest.fn();
        await renderHookWithBasicProvider(() => useOnNavigationRemove({ onRemoveAttempt }));

        for (const type of ['GO_BACK', 'POP', 'RESET', 'CUSTOM_ACTION']) {
            const event = triggerRemoval(type);
            expect(onRemoveAttempt).toHaveBeenLastCalledWith(event.data.action);
            expect(event.preventDefault).not.toHaveBeenCalled();
        }
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('only observes selected actions', async () => {
        const onRemoveAttempt = jest.fn();
        await renderHookWithBasicProvider(() =>
            useOnNavigationRemove({ actionTypes: BACK_NAVIGATION_ACTIONS, onRemoveAttempt }),
        );
        triggerRemoval('GO_BACK');
        triggerRemoval('POP');
        triggerRemoval('RESET');

        expect(onRemoveAttempt).toHaveBeenCalledTimes(2);
    });

    it.each<Partial<UseOnNavigationRemoveParams>>([{ isEnabled: false }, { actionTypes: [] }])(
        'does not notify for %j',
        async options => {
            const onRemoveAttempt = jest.fn();
            await renderHookWithBasicProvider(() =>
                useOnNavigationRemove({ ...options, onRemoveAttempt }),
            );
            triggerRemoval('GO_BACK');

            expect(onRemoveAttempt).not.toHaveBeenCalled();
            expect(mockDispatch).not.toHaveBeenCalled();
        },
    );

    it('uses the latest callback and configuration without reordering the subscription', async () => {
        const originalCallback = jest.fn();
        const latestCallback = jest.fn();
        const { rerender } = await renderHookWithBasicProvider(
            (props: UseOnNavigationRemoveParams) => useOnNavigationRemove(props),
            {
                initialProps: {
                    isEnabled: false,
                    actionTypes: BACK_NAVIGATION_ACTIONS,
                    onRemoveAttempt: originalCallback,
                },
            },
        );
        triggerRemoval('GO_BACK');
        await rerender({
            isEnabled: true,
            actionTypes: ['RESET'],
            onRemoveAttempt: latestCallback,
        });
        triggerRemoval('GO_BACK');
        triggerRemoval('RESET');

        expect(originalCallback).not.toHaveBeenCalled();
        expect(latestCallback).toHaveBeenCalledTimes(1);
        expect(latestCallback).toHaveBeenCalledWith({ type: 'RESET' });
        expect(mockAddListener).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes on unmount', async () => {
        const { unmount } = await renderHookWithBasicProvider(() =>
            useOnNavigationRemove({ onRemoveAttempt: jest.fn() }),
        );
        await unmount();

        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
});
