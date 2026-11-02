import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    ReceiveStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
} from '@suite-native/navigation';
import { fireEvent, renderWithBasicProvider } from '@suite-native/test-utils';

import { AssetDetailActions } from './AssetDetailActions';

const mockNavigate = jest.fn();
const mockUseSelector = jest.fn();
const mockNetworkSymbol = asNetworkSymbol('eth');
const mockTokenContract = '0x1234567890123456789012345678901234567890' as TokenAddress;
const mockReceiveAsset = { networkSymbol: mockNetworkSymbol };
const mockRouteParams: AssetsStackParamList[AssetsStackRoutes.AssetDetail] = {
    networkSymbol: mockNetworkSymbol,
    tokenContract: mockTokenContract,
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
    useRoute: () => ({ params: mockRouteParams }),
}));

jest.mock('react-redux', () => ({
    ...jest.requireActual('react-redux'),
    useSelector: mockUseSelector,
}));

jest.mock('@suite-common/receive', () => ({
    buildGlobalReceiveAssetOption: () => mockReceiveAsset,
}));

describe('AssetDetailActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSelector
            .mockReturnValueOnce('asset-key')
            .mockReturnValueOnce('USD Coin')
            .mockReturnValueOnce('USDC');
    });

    it('opens receive with the selected asset prefiltered', async () => {
        const { getByTestId } = await renderWithBasicProvider(<AssetDetailActions />);

        fireEvent.press(getByTestId('@assets/asset-detail/receive-button'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccounts,
            params: {
                asset: mockReceiveAsset,
                closeActionType: 'back',
            },
        });
    });

    it('opens send with the selected network prefiltered', async () => {
        const { getByTestId } = await renderWithBasicProvider(<AssetDetailActions />);

        fireEvent.press(getByTestId('@assets/asset-detail/send-button'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
            params: {
                networksFilter: [mockNetworkSymbol],
            },
        });
    });
});
