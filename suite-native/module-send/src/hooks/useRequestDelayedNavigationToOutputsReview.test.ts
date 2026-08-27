import { type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';

import { useRequestDelayedNavigationToOutputsReview } from './useRequestDelayedNavigationToOutputsReview';

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

const accountKey = mockAccountKey({ descriptor: 'accountKey' });

describe('useRequestDelayedNavigationToOutputsReview', () => {
    const renderUseRequestDelayedNavigationToOutputsReview = async () =>
        await renderHookWithStoreProvider(() =>
            useRequestDelayedNavigationToOutputsReview({
                accountKey,
                tokenContract: 'tokenContract' as TokenAddress,
            }),
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call navigate once there are any button requests', async () => {
        const { result, rerender } = await renderUseRequestDelayedNavigationToOutputsReview();

        await act(() => {
            result.current();
        });

        expect(mockNavigate).not.toHaveBeenCalled();

        mockSelectDeviceButtonRequestsCodes.mockReturnValue(['buttonRequestMock1']);
        await rerender({});

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('SendOutputsReview', {
            accountKey,
            tokenContract: 'tokenContract',
        });
    });
});
