import { asNetworkSymbol } from '@suite-common/wallet-config';
import { toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { RootStackRoutes, YieldStackRoutes } from '@suite-native/navigation';

import { type StablecoinYieldNavigationItem } from '../types';
import { navigateByYieldAccountState } from './navigateByYieldAccountState';

const ethSymbol = asNetworkSymbol('eth');

const WETH_ADDRESS = toTokenAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
const USDC_ADDRESS = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
const RECEIPT_ADDRESS = toTokenAddress('0xde6c23e561f3e55846207ec45a91b777e0f7c889');

const createMockItem = (
    underlyingTokenContract: StablecoinYieldNavigationItem['underlyingTokenContract'],
): StablecoinYieldNavigationItem => ({
    yieldId: 'ethereum-vault',
    underlyingTokenContract,
    receiptTokenContract: RECEIPT_ADDRESS,
});

const mockNavigate = jest.fn();
const isFirmwareSupported = jest.fn().mockReturnValue(true);
const showFirmwareUpdateAlert = jest.fn();

const navigate = (
    account: Parameters<typeof navigateByYieldAccountState>[0],
    item = createMockItem(WETH_ADDRESS),
) =>
    navigateByYieldAccountState(
        account,
        item,
        mockNavigate,
        isFirmwareSupported,
        showFirmwareUpdateAlert,
    );

describe(navigateByYieldAccountState.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
        isFirmwareSupported.mockReturnValue(true);
    });

    it('navigates to the vault detail when the account holds the receipt token', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            tokens: [mockAccountToken({ contract: RECEIPT_ADDRESS, balance: '1' })],
        });

        expect(navigate(account)).toBe('vault-detail');
        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.YieldVaultDetail, {
            accountKey: account.key,
            tokenContract: RECEIPT_ADDRESS,
        });
    });

    it('prefers the vault detail over the deposit flow when the account holds both a receipt position and a depositable balance', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1',
            tokens: [mockAccountToken({ contract: RECEIPT_ADDRESS, balance: '1' })],
        });

        expect(navigate(account)).toBe('vault-detail');
    });

    it('routes a native-only account into the deposit flow for a wrapped-native vault', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1',
        });

        expect(navigate(account)).toBe('deposit-in-a-nutshell-modal');
        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.HowYieldWorks,
            params: {
                accountKey: account.key,
                tokenContract: WETH_ADDRESS,
                yieldId: 'ethereum-vault',
            },
        });
        expect(isFirmwareSupported).toHaveBeenCalledWith('deposit', {
            networkSymbol: ethSymbol,
            contractAddress: WETH_ADDRESS,
        });
    });

    it('counts a small native balance as fully depositable (no gas reserve deducted)', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '0.003',
        });

        expect(navigate(account)).toBe('deposit-in-a-nutshell-modal');
    });

    it('routes to the insufficient-balance screen when the account is empty', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '0',
        });

        expect(navigate(account)).toBe('insufficient-balance-screen');
        expect(mockNavigate).toHaveBeenCalledWith(RootStackRoutes.YieldInsufficientBalance, {
            accountKey: account.key,
            tokenContract: WETH_ADDRESS,
            yieldId: 'ethereum-vault',
        });
    });

    it('does not count the native balance for a non-wrapped-native vault', () => {
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '5',
        });

        expect(navigate(account, createMockItem(USDC_ADDRESS))).toBe('insufficient-balance-screen');
    });

    it('shows the firmware update alert for a depositable account with unsupported firmware', () => {
        isFirmwareSupported.mockReturnValue(false);
        const account = mockWalletAccount({
            symbol: ethSymbol,
            formattedBalance: '1',
        });

        expect(navigate(account)).toBe('firmware-update-alert');
        expect(showFirmwareUpdateAlert).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
