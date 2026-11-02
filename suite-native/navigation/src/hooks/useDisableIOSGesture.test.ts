import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useDisableIOSGesture } from './useDisableIOSGesture';

type MockNavigation = {
    setOptions: jest.Mock;
    getParent: jest.Mock;
};

let mockParent: MockNavigation;
let mockNavigation: MockNavigation;

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => mockNavigation,
}));

describe(useDisableIOSGesture.name, () => {
    beforeEach(() => {
        mockParent = { setOptions: jest.fn(), getParent: jest.fn() };
        mockNavigation = { setOptions: jest.fn(), getParent: jest.fn(() => mockParent) };
    });

    it('disables gestures on the screen and all its parents', async () => {
        await renderHookWithBasicProvider(() => useDisableIOSGesture());

        expect(mockNavigation.setOptions).toHaveBeenCalledWith({ gestureEnabled: false });
        expect(mockParent.setOptions).toHaveBeenCalledWith({ gestureEnabled: false });
    });

    it('keeps gestures disabled until the last consumer unmounts', async () => {
        const first = await renderHookWithBasicProvider(() => useDisableIOSGesture());
        const second = await renderHookWithBasicProvider(() => useDisableIOSGesture());

        await second.unmount();

        expect(mockNavigation.setOptions).not.toHaveBeenCalledWith({ gestureEnabled: true });
        expect(mockParent.setOptions).not.toHaveBeenCalledWith({ gestureEnabled: true });

        await first.unmount();

        expect(mockNavigation.setOptions).toHaveBeenCalledWith({ gestureEnabled: true });
        expect(mockParent.setOptions).toHaveBeenCalledWith({ gestureEnabled: true });
    });
});
