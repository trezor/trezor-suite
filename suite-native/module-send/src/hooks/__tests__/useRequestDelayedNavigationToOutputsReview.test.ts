import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils';

import { useRequestDelayedNavigationToOutputsReview } from '../useRequestDelayedNavigationToOutputsReview';

const mockSelectDeviceButtonRequestsCodes = jest.fn().mockReturnValue([]);
const mockNavigate = jest.fn();

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectDeviceButtonRequestsCodes: () => mockSelectDeviceButtonRequestsCodes(),
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
    }),
}));

describe('useRequestDelayedNavigationToOutputsReview', () => {
    const renderUseRequestDelayedNavigationToOutputsReview = () =>
        renderHookWithStoreProvider(() =>
            useRequestDelayedNavigationToOutputsReview({
                accountKey: 'accountKey' as AccountKey,
                tokenContract: 'tokenContract' as TokenAddress,
            }),
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call navigate once there are any button requests', () => {
        const { result, rerender } = renderUseRequestDelayedNavigationToOutputsReview();

        act(() => {
            result.current();
        });

        expect(mockNavigate).not.toHaveBeenCalled();

        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        rerender({});

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('SendOutputsReview', {
            accountKey: 'accountKey',
            tokenContract: 'tokenContract',
        });
    });
});
