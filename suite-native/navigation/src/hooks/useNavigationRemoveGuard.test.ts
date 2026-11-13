import { type NavigationAction, usePreventRemove } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import {
    type UseNavigationRemoveGuardParams,
    useNavigationRemoveGuard,
} from './useNavigationRemoveGuard';
import { DEFAULT_BACK_NAVIGATION_ACTIONS } from '../navigationRemove';

const mockDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ dispatch: mockDispatch }),
    usePreventRemove: jest.fn(),
}));

const mockedUsePreventRemove = jest.mocked(usePreventRemove);
const triggerRemoval = (action: NavigationAction) => {
    const options = mockedUsePreventRemove.mock.calls.at(-1);

    if (!options) {
        throw new Error('Expected a registered guard');
    }

    const [isEnabled, callback] = options;

    if (isEnabled) {
        callback({ data: { action } });
    }
};

describe('useNavigationRemoveGuard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(DEFAULT_BACK_NAVIGATION_ACTIONS)('blocks %s by default', async type => {
        const onBlocked = jest.fn();
        const action = { type, [Symbol('navigation metadata')]: new Set(['review']) };

        await renderHookWithBasicProvider(() => useNavigationRemoveGuard({ onBlocked }));
        triggerRemoval(action);

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(onBlocked).toHaveBeenCalledWith({
            action,
            forceNavigation: expect.any(Function),
        });
    });

    it('keeps default actions blocked without a callback', async () => {
        await renderHookWithBasicProvider(() => useNavigationRemoveGuard());
        triggerRemoval({ type: 'GO_BACK' });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it.each(['RESET', 'REPLACE', 'POP_TO_TOP', 'CUSTOM_ACTION'])(
        'blocks %s when all actions are selected',
        async type => {
            const onBlocked = jest.fn();
            await renderHookWithBasicProvider(() =>
                useNavigationRemoveGuard({ actionTypes: 'all', onBlocked }),
            );
            triggerRemoval({ type });

            expect(onBlocked).toHaveBeenCalledTimes(1);
            expect(mockDispatch).not.toHaveBeenCalled();
        },
    );

    it.each([{ actionTypes: DEFAULT_BACK_NAVIGATION_ACTIONS }, { actionTypes: [] }])(
        'forwards unmatched actions for %j',
        async ({ actionTypes }) => {
            const onBlocked = jest.fn();
            const action = { type: 'RESET' };
            await renderHookWithBasicProvider(() =>
                useNavigationRemoveGuard({ actionTypes, onBlocked }),
            );
            triggerRemoval(action);

            expect(onBlocked).not.toHaveBeenCalled();
            expect(mockDispatch.mock.calls[0][0]).toBe(action);
        },
    );

    it('disables prevention and callbacks when disabled', async () => {
        const onBlocked = jest.fn();
        await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ isEnabled: false, actionTypes: 'all', onBlocked }),
        );
        triggerRemoval({ type: 'GO_BACK' });

        expect(mockedUsePreventRemove).toHaveBeenCalledWith(false, expect.any(Function));
        expect(onBlocked).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('resumes the blocked action through forceNavigation after asynchronous confirmation', async () => {
        let confirm: (() => void) | undefined;
        const confirmation = new Promise<void>(resolve => {
            confirm = resolve;
        });
        const onBlocked: UseNavigationRemoveGuardParams['onBlocked'] = async ({
            action: blockedAction,
            forceNavigation,
        }) => {
            await confirmation;
            forceNavigation(() => triggerRemoval(blockedAction));
        };
        const action = { type: 'GO_BACK' };
        await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ actionTypes: 'all', onBlocked }),
        );
        triggerRemoval(action);
        expect(mockDispatch).not.toHaveBeenCalled();

        confirm?.();
        await confirmation;

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch.mock.calls[0][0]).toBe(action);
    });

    it('lets navigation dispatched inside forceNavigation through without calling onBlocked', async () => {
        const onBlocked = jest.fn();
        const action = { type: 'GO_BACK' };
        const { result } = await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ onBlocked }),
        );

        result.current.forceNavigation(() => triggerRemoval(action));

        expect(onBlocked).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch.mock.calls[0][0]).toBe(action);
    });

    it('lets onBlocked bypass the guard for the navigation it dispatches', async () => {
        const followUpAction = { type: 'GO_BACK' };
        const onBlocked = jest.fn<void, [{ forceNavigation: (navigate: () => void) => void }]>(
            ({ forceNavigation }) => forceNavigation(() => triggerRemoval(followUpAction)),
        );
        await renderHookWithBasicProvider(() => useNavigationRemoveGuard({ onBlocked }));

        triggerRemoval({ type: 'POP' });

        expect(onBlocked).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch.mock.calls[0][0]).toBe(followUpAction);
    });

    it('blocks again after forceNavigation returns', async () => {
        const onBlocked = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ onBlocked }),
        );

        result.current.forceNavigation(() => {});
        triggerRemoval({ type: 'GO_BACK' });

        expect(onBlocked).toHaveBeenCalledTimes(1);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('blocks again after forceNavigation throws', async () => {
        const onBlocked = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ onBlocked }),
        );

        expect(() =>
            result.current.forceNavigation(() => {
                throw new Error('navigation failed');
            }),
        ).toThrow('navigation failed');
        triggerRemoval({ type: 'GO_BACK' });

        expect(onBlocked).toHaveBeenCalledTimes(1);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('keeps bypassing after a nested forceNavigation returns', async () => {
        const onBlocked = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ onBlocked }),
        );

        result.current.forceNavigation(() => {
            result.current.forceNavigation(() => {});
            triggerRemoval({ type: 'POP' });
        });

        expect(onBlocked).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('does not bypass navigation dispatched after forceNavigation awaits', async () => {
        const onBlocked = jest.fn();
        const { result } = await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ onBlocked }),
        );

        let delayedNavigation: Promise<void> | undefined;
        result.current.forceNavigation(() => {
            delayedNavigation = Promise.resolve().then(() => triggerRemoval({ type: 'GO_BACK' }));
        });
        await delayedNavigation;

        expect(onBlocked).toHaveBeenCalledTimes(1);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not continue when an asynchronous callback resolves without continuing', async () => {
        const onBlocked = jest.fn(async () => {});
        await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ actionTypes: 'all', onBlocked }),
        );
        triggerRemoval({ type: 'GO_BACK' });
        await onBlocked.mock.results[0]?.value;

        expect(mockDispatch).not.toHaveBeenCalled();
    });
});
