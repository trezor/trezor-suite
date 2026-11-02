import { selectWalletAssetHasSpendableBalance } from '@suite-common/assets';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
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
    selectWalletAssetHasSpendableBalance: jest.fn(),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsPortfolioTrackerDevice: jest.fn(),
}));

jest.mock('@suite-native/device', () => ({
    ...jest.requireActual('@suite-native/device'),
    selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice: jest.fn(),
}));

jest.mock('@suite-common/receive', () => ({
    buildGlobalReceiveAssetOption: () => mockReceiveAsset,
}));

const mockHasSpendableBalance = jest.mocked(selectWalletAssetHasSpendableBalance);
const mockIsPortfolioTrackerDevice = jest.mocked(selectIsPortfolioTrackerDevice);
const mockHasFirmwareAuthenticityCheckHardFailed = jest.mocked(
    selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
);

describe('AssetDetailActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockHasSpendableBalance.mockReturnValue(true);
        mockIsPortfolioTrackerDevice.mockReturnValue(false);
        mockHasFirmwareAuthenticityCheckHardFailed.mockReturnValue(false);
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

    it('offers no send button while the asset has nothing to spend', async () => {
        mockHasSpendableBalance.mockReturnValue(false);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/send-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/receive-button')).not.toBeNull();
    });

    it('offers no send button on a portfolio tracker, which holds no keys to sign with', async () => {
        mockIsPortfolioTrackerDevice.mockReturnValue(true);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/send-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/receive-button')).not.toBeNull();
    });

    it('offers no receive button once the firmware authenticity check hard fails', async () => {
        mockHasFirmwareAuthenticityCheckHardFailed.mockReturnValue(true);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/receive-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/send-button')).not.toBeNull();
    });

    it('renders nothing once neither action is left to offer', async () => {
        mockHasSpendableBalance.mockReturnValue(false);
        mockHasFirmwareAuthenticityCheckHardFailed.mockReturnValue(true);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/receive-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/send-button')).toBeNull();
    });
});
