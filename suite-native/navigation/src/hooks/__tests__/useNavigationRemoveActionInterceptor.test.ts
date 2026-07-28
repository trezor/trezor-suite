import { type NavigationAction, usePreventRemove } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigationRemoveActionInterceptor } from '../useNavigationRemoveActionInterceptor';

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
        mockDispatch.mockReset();
    });

    it('intercepts GO_BACK and POP by default', () => {
        const onInterceptedAction = jest.fn();
        const actions: NavigationAction[] = [{ type: 'GO_BACK' }, { type: 'POP' }];

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({ onInterceptedAction }),
        );

        actions.forEach(triggerPreventRemoveAction);

        expect(onInterceptedAction).toHaveBeenCalledTimes(actions.length);
        actions.forEach(action => {
            expect(onInterceptedAction).toHaveBeenCalledWith(action);
        });
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('calls onInterceptedAction when action type is included in actionTypes', () => {
        const onInterceptedAction = jest.fn();
        const action: NavigationAction = { type: 'GO_BACK' };

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({
                actionTypesToIntercept: ['GO_BACK'],
                onInterceptedAction,
            }),
        );
        triggerPreventRemoveAction(action);

        expect(onInterceptedAction).toHaveBeenCalledWith(action);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not call onInterceptedAction when action type is not included in actionTypes', () => {
        const onInterceptedAction = jest.fn();
        const onPassThroughAction = jest.fn();
        const action: NavigationAction = { type: 'POP' };

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({
                actionTypesToIntercept: ['GO_BACK'],
                onInterceptedAction,
                onPassThroughAction,
            }),
        );
        triggerPreventRemoveAction(action);

        expect(onInterceptedAction).not.toHaveBeenCalled();
        expect(onPassThroughAction).toHaveBeenCalledWith(action);
        expect(mockDispatch).toHaveBeenCalledWith(action);
    });

    it('passes through every action when actionTypesToIntercept is empty', () => {
        const callOrder: string[] = [];
        const onPassThroughAction = jest.fn(() => callOrder.push('callback'));
        mockDispatch.mockImplementation(() => {
            callOrder.push('dispatch');
        });
        const actions: NavigationAction[] = [
            { type: 'GO_BACK' },
            { type: 'POP' },
            { type: 'POP_TO_TOP' },
        ];

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({
                actionTypesToIntercept: [],
                onPassThroughAction,
            }),
        );

        actions.forEach(triggerPreventRemoveAction);

        expect(onPassThroughAction).toHaveBeenCalledTimes(actions.length);
        expect(mockDispatch).toHaveBeenCalledTimes(actions.length);
        actions.forEach(action => {
            expect(onPassThroughAction).toHaveBeenCalledWith(action);
            expect(mockDispatch).toHaveBeenCalledWith(action);
        });
        expect(callOrder).toEqual(actions.flatMap(() => ['callback', 'dispatch']));
    });

    it('intercepts custom remove action types', () => {
        const onInterceptedAction = jest.fn();
        const action: NavigationAction = { type: 'POP_TO_TOP' };

        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({
                actionTypesToIntercept: ['POP_TO_TOP'],
                onInterceptedAction,
            }),
        );
        triggerPreventRemoveAction(action);

        expect(onInterceptedAction).toHaveBeenCalledWith(action);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('passes isEnabled to usePreventRemove', () => {
        renderHookWithBasicProvider(() =>
            useNavigationRemoveActionInterceptor({ isEnabled: false }),
        );

        expect(mockedUsePreventRemove).toHaveBeenCalledWith(false, expect.any(Function));
    });
});
