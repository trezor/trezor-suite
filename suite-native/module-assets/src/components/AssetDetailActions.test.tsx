import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import {
    type AssetsStackParamList,
    type AssetsStackRoutes,
    ReceiveStackRoutes,
    RootStackRoutes,
    SendStackRoutes,
} from '@suite-native/navigation';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AssetDetailActions } from './AssetDetailActions';

const mockNavigate = jest.fn();
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

// Mocking the selectors rather than the `useSelector` calls keeps the test free of the order
// the component happens to read them in.
jest.mock('@suite-common/assets', () => ({
    selectWalletAssetKey: () => 'asset-key',
    selectWalletAssetName: () => 'USD Coin',
    selectWalletAssetTokenSymbol: () => 'USDC',
}));

jest.mock('@suite-common/receive', () => ({
    buildGlobalReceiveAssetOption: () => mockReceiveAsset,
}));

describe('AssetDetailActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('opens receive with the selected asset prefiltered', async () => {
        const { getByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

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
        const { getByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        fireEvent.press(getByTestId('@assets/asset-detail/send-button'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
            params: {
                networksFilter: [mockNetworkSymbol],
            },
        });
    });
});
