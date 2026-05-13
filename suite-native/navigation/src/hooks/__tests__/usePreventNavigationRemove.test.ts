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

    it('calls onNavigateBack when action type is included in actionTypes', () => {
        const onNavigateBack = jest.fn();
        const action: NavigationAction = { type: 'GO_BACK' };

        renderHookWithBasicProvider(() =>
            usePreventNavigationRemove({ actionTypes: ['GO_BACK'], onNavigateBack }),
        );
        triggerPreventRemoveAction(action);

        expect(onNavigateBack).toHaveBeenCalledWith(action);
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('does not call onNavigateBack when action type is not included in actionTypes', () => {
        const onNavigateBack = jest.fn();
        const action: NavigationAction = { type: 'POP' };

        renderHookWithBasicProvider(() =>
            usePreventNavigationRemove({ actionTypes: ['GO_BACK'], onNavigateBack }),
        );
        triggerPreventRemoveAction(action);

        expect(onNavigateBack).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(action);
    });
});
