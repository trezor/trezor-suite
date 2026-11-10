import { selectWalletAssetSignVerifyAccounts } from '@suite-common/assets';
import { selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { RootStackRoutes } from '@suite-native/navigation';
import { fireEvent, renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { AssetSettingsSignAndVerifyAction } from './AssetSettingsSignAndVerifyAction';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('@suite-common/assets', () => ({
    selectWalletAssetKey: () => 'asset-key',
    selectWalletAssetSignVerifyAccounts: jest.fn(),
}));

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsPortfolioTrackerDevice: jest.fn(),
}));

const ETH = asNetworkSymbol('eth');
const SIGN_AND_VERIFY_BUTTON = '@asset-detail/settings/sign-and-verify-button';

const firstAccount = mockWalletAccount({
    descriptor: asAccountDescriptor('ethfirst'),
    symbol: ETH,
});
const secondAccount = mockWalletAccount({
    descriptor: asAccountDescriptor('ethsecond'),
    symbol: ETH,
});

const mockSignAndVerifyAccounts = jest.mocked(selectWalletAssetSignVerifyAccounts);
const mockIsPortfolioTrackerDevice = jest.mocked(selectIsPortfolioTrackerDevice);

const renderAction = async () => {
    const onOpenSignAndVerifyAccounts = jest.fn();
    const onClose = jest.fn();

    await renderWithStoreProvider(
        <AssetSettingsSignAndVerifyAction
            networkSymbol={ETH}
            onOpenSignAndVerifyAccounts={onOpenSignAndVerifyAccounts}
            onClose={onClose}
        />,
    );

    return { onOpenSignAndVerifyAccounts, onClose };
};

describe('AssetSettingsSignAndVerifyAction', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSignAndVerifyAccounts.mockReturnValue([firstAccount]);
        mockIsPortfolioTrackerDevice.mockReturnValue(false);
    });

    it('opens sign & verify directly when one account can sign', async () => {
        const { onOpenSignAndVerifyAccounts, onClose } = await renderAction();

        fireEvent.press(screen.getByTestId(SIGN_AND_VERIFY_BUTTON));

        expect(onClose).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.SignAndVerify, {
            accountKey: firstAccount.key,
        });
        expect(onOpenSignAndVerifyAccounts).not.toHaveBeenCalled();
    });

    it('asks which account to use when several can sign', async () => {
        mockSignAndVerifyAccounts.mockReturnValue([firstAccount, secondAccount]);
        const { onOpenSignAndVerifyAccounts } = await renderAction();

        fireEvent.press(screen.getByTestId(SIGN_AND_VERIFY_BUTTON));

        expect(onOpenSignAndVerifyAccounts).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('is left out when no account of the network can sign', async () => {
        mockSignAndVerifyAccounts.mockReturnValue([]);
        await renderAction();

        expect(screen.queryByTestId(SIGN_AND_VERIFY_BUTTON)).toBeNull();
    });

    it('is left out for the portfolio tracker, which has no device to sign with', async () => {
        mockIsPortfolioTrackerDevice.mockReturnValue(true);
        await renderAction();

        expect(screen.queryByTestId(SIGN_AND_VERIFY_BUTTON)).toBeNull();
    });
});
