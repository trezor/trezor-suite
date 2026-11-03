import { selectWalletAssetAccounts } from '@suite-common/assets';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountKey,
    type TokenAddress,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { selectFilteredDeviceAccountListRows } from '@suite-native/accounts';
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
const mockAccount = mockWalletAccount({
    descriptor: asAccountDescriptor('ethdefault'),
    symbol: mockNetworkSymbol,
});
const mockSecondAccount = mockWalletAccount({
    descriptor: asAccountDescriptor('ethsecond'),
    symbol: mockNetworkSymbol,
});
const mockAccountKey = mockAccount.key;
const mockReceiveAsset = { networkSymbol: mockNetworkSymbol };
const getAccountRow = (accountKey: AccountKey) => ({
    accountKey,
    isFirst: true,
    isLast: true,
});
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
    selectWalletAssetAccounts: jest.fn(),
}));

jest.mock('@suite-native/accounts', () => ({
    selectFilteredDeviceAccountListRows: jest.fn(),
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

const mockAssetAccounts = jest.mocked(selectWalletAssetAccounts);
const mockSendableAccountRows = jest.mocked(selectFilteredDeviceAccountListRows);
const mockIsPortfolioTrackerDevice = jest.mocked(selectIsPortfolioTrackerDevice);
const mockHasFirmwareAuthenticityCheckHardFailed = jest.mocked(
    selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
);

describe('AssetDetailActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAssetAccounts.mockReturnValue([]);
        mockSendableAccountRows.mockReturnValue([]);
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

    it('opens the receive address directly when the asset has one account', async () => {
        mockAssetAccounts.mockReturnValue([mockAccount]);

        const { getByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        fireEvent.press(getByTestId('@assets/asset-detail/receive-button'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAddress,
            params: {
                accountKey: mockAccountKey,
                tokenContract: mockTokenContract,
                closeActionType: 'back',
            },
        });
    });

    it('opens send with the selected network prefiltered', async () => {
        mockSendableAccountRows.mockReturnValue([
            getAccountRow(mockAccountKey),
            getAccountRow(mockSecondAccount.key),
        ]);

        const { getByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        fireEvent.press(getByTestId('@assets/asset-detail/send-button'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
            params: {
                asset: { networkSymbol: mockNetworkSymbol, tokenContract: mockTokenContract },
            },
        });
    });

    it('opens send outputs directly when the asset has one account', async () => {
        mockSendableAccountRows.mockReturnValue([getAccountRow(mockAccountKey)]);

        const { getByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        fireEvent.press(getByTestId('@assets/asset-detail/send-button'));

        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendOutputs,
            params: {
                accountKey: mockAccountKey,
                tokenContract: mockTokenContract,
            },
        });
    });

    it('offers no send button when there are no sendable accounts', async () => {
        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/send-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/receive-button')).not.toBeNull();
    });

    it('offers no send button on a portfolio tracker, which holds no keys to sign with', async () => {
        mockSendableAccountRows.mockReturnValue([getAccountRow(mockAccountKey)]);
        mockIsPortfolioTrackerDevice.mockReturnValue(true);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/send-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/receive-button')).not.toBeNull();
    });

    it('offers no receive button once the firmware authenticity check hard fails', async () => {
        mockSendableAccountRows.mockReturnValue([getAccountRow(mockAccountKey)]);
        mockHasFirmwareAuthenticityCheckHardFailed.mockReturnValue(true);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/receive-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/send-button')).not.toBeNull();
    });

    it('renders nothing once neither action is left to offer', async () => {
        mockHasFirmwareAuthenticityCheckHardFailed.mockReturnValue(true);

        const { queryByTestId } = await renderWithStoreProvider(<AssetDetailActions />);

        expect(queryByTestId('@assets/asset-detail/receive-button')).toBeNull();
        expect(queryByTestId('@assets/asset-detail/send-button')).toBeNull();
    });
});
