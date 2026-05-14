import { type NavigationAction, usePreventRemove } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { usePreventNavigationRemove } from '../usePreventNavigationRemove';

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
    const [, onPreventRemove] = mockedUsePreventRemove.mock.calls[0];

    onPreventRemove({ data: { action } } as Parameters<typeof onPreventRemove>[0]);
};

describe('usePreventNavigationRemove', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('calls onPreventedRemove when action type is included in actionTypes', () => {
        const onPreventedRemove = jest.fn();
        const action: NavigationAction = { type: 'GO_BACK' };

        renderHookWithBasicProvider(() =>
            usePreventNavigationRemove({ actionTypes: ['GO_BACK'], onPreventedRemove }),
        );
        triggerPreventRemoveAction(action);

        expect(onPreventedRemove).toHaveBeenCalledWith(action);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not call onPreventedRemove when action type is not included in actionTypes', () => {
        const onPreventedRemove = jest.fn();
        const onAllowedRemove = jest.fn();
        const action: NavigationAction = { type: 'POP' };

        renderHookWithBasicProvider(() =>
            usePreventNavigationRemove({
                actionTypes: ['GO_BACK'],
                onPreventedRemove,
                onAllowedRemove,
            }),
        );
        triggerPreventRemoveAction(action);

        expect(onPreventedRemove).not.toHaveBeenCalled();
        expect(onAllowedRemove).toHaveBeenCalledWith(action);
        expect(mockDispatch).toHaveBeenCalledWith(action);
    });
});
