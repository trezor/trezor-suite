import { type NavigationAction } from '@react-navigation/native';

import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useNavigationBackListener } from './useNavigationBackListener';

const mockAddListener = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        addListener: mockAddListener,
    }),
}));

const triggerBeforeRemove = (action: NavigationAction) => {
    const [, listener] = mockAddListener.mock.calls[0];
    const preventDefault = jest.fn();

    listener({ data: { action }, preventDefault });

    return preventDefault;
};

describe('useNavigationBackListener', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each(['GO_BACK', 'POP'])('calls onBack without preventing %s removal', async type => {
        const onBack = jest.fn();
        const action: NavigationAction = { type };

        await renderHookWithBasicProvider(() => useNavigationBackListener({ onBack }));
        const preventDefault = triggerBeforeRemove(action);

        expect(mockAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
        expect(onBack).toHaveBeenCalledWith(action);
        expect(preventDefault).not.toHaveBeenCalled();
    });

    it('ignores non-back removals', async () => {
        const onBack = jest.fn();

        await renderHookWithBasicProvider(() => useNavigationBackListener({ onBack }));
        triggerBeforeRemove({ type: 'RESET' });

        expect(onBack).not.toHaveBeenCalled();
    });
});
