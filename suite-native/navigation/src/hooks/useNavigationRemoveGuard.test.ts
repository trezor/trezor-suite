import { type NavigationAction, usePreventRemove } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import {
    type UseNavigationRemoveGuardParams,
    useNavigationRemoveGuard,
} from './useNavigationRemoveGuard';
import { BACK_NAVIGATION_ACTIONS } from '../navigationRemove';

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

    it.each(BACK_NAVIGATION_ACTIONS)('blocks %s until explicitly continued', async type => {
        const onBlocked = jest.fn();
        const action = { type, [Symbol('navigation metadata')]: new Set(['review']) };

        await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ actionTypes: BACK_NAVIGATION_ACTIONS, onBlocked }),
        );
        triggerRemoval(action);

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(onBlocked).toHaveBeenCalledWith({
            action,
            continueNavigation: expect.any(Function),
        });

        const { continueNavigation } = onBlocked.mock.calls[0][0];
        continueNavigation();
        continueNavigation();

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(mockDispatch.mock.calls[0][0]).toBe(action);
    });

    it('keeps matching actions blocked without a callback', async () => {
        await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ actionTypes: BACK_NAVIGATION_ACTIONS }),
        );
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

    it.each([{ actionTypes: BACK_NAVIGATION_ACTIONS }, { actionTypes: [] }])(
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

    it('waits for explicit continuation after asynchronous confirmation', async () => {
        let confirm: (() => void) | undefined;
        const confirmation = new Promise<void>(resolve => {
            confirm = resolve;
        });
        const onBlocked: UseNavigationRemoveGuardParams['onBlocked'] = async ({
            continueNavigation,
        }) => {
            await confirmation;
            continueNavigation();
        };
        await renderHookWithBasicProvider(() =>
            useNavigationRemoveGuard({ actionTypes: 'all', onBlocked }),
        );
        triggerRemoval({ type: 'GO_BACK' });
        expect(mockDispatch).not.toHaveBeenCalled();

        confirm?.();
        await confirmation;
        expect(mockDispatch).toHaveBeenCalledTimes(1);
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
