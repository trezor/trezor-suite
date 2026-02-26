import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';

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
        renderHookWithStoreProviderAsync(() =>
            useRequestDelayedNavigationToOutputsReview({
                accountKey: 'accountKey' as AccountKey,
                tokenContract: 'tokenContract' as TokenAddress,
            }),
        );

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call navigate once there are any button requests', async () => {
        const { result, rerender } = await renderUseRequestDelayedNavigationToOutputsReview();

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
