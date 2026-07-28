import { type NavigationAction, usePreventRemove } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigationRemoveActionInterceptor } from './useNavigationRemoveActionInterceptor';

const mockDispatch = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        dispatch: mockDispatch,
    }),
    usePreventRemove: jest.fn(),
}));

const mockedUsePreventRemove = jest.mocked(usePreventRemove);

const triggerPreventRemoveAction = (action: NavigationAction) => {
    const preventRemoveCall = mockedUsePreventRemove.mock.calls[0];

    if (!preventRemoveCall) {
        throw new Error('Expected usePreventRemove to be called');
    }

    const [, onPreventRemove] = preventRemoveCall;

    onPreventRemove({ data: { action } } as Parameters<typeof onPreventRemove>[0]);
};

describe('useNavigationRemoveActionInterceptor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('calls onInterceptedAction when action type is included in actionTypes', () => {
        const onInterceptedAction = jest.fn();
        const action: NavigationAction = { type: 'GO_BACK' };

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({
                interceptedActionTypes: ['GO_BACK'],
                onInterceptedAction,
            }),
        );
        triggerPreventRemoveAction(action);

        expect(onInterceptedAction).toHaveBeenCalledWith(action);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not call onInterceptedAction when action type is not included in actionTypes', () => {
        const onInterceptedAction = jest.fn();
        const onAllowedAction = jest.fn();
        const action: NavigationAction = { type: 'POP' };

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({
                interceptedActionTypes: ['GO_BACK'],
                onInterceptedAction,
                onAllowedAction,
            }),
        );
        triggerPreventRemoveAction(action);

        expect(onInterceptedAction).not.toHaveBeenCalled();
        expect(onAllowedAction).toHaveBeenCalledWith(action);
        expect(mockDispatch).toHaveBeenCalledWith(action);
    });
});
