import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useDelayedReviewOutputListDisplayFlag } from '../useDelayedReviewOutputListDisplayFlag';

const mockSelectDeviceButtonRequestsCodes = jest.fn().mockReturnValue([]);

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectDeviceButtonRequestsCodes: () => mockSelectDeviceButtonRequestsCodes(),
}));

describe('useDelayedReviewOutputListDisplayFlag', () => {
    const renderUseRequestDelayedNavigationToOutputsReview = () =>
        renderHookWithStoreProvider(() => useDelayedReviewOutputListDisplayFlag());

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should became once there are any button requests', () => {
        const { result, rerender } = renderUseRequestDelayedNavigationToOutputsReview();

        expect(result.current).toBe(false);

        // we are using mocked selector, so we need to rerender the hook to get updated value
        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        rerender({});

        expect(result.current).toBe(true);
    });
});
