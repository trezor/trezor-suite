import { CryptoId } from 'invity-api';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { fireEvent, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { BigNumber } from '@trezor/utils';

import { getBtcAccount, getEthAccount } from '../../../../__fixtures__/account';
import { MyAsset } from '../../../../types/general';
import { MyAssetListItem, MyAssetListItemProps } from '../MyAssetListItem';

describe('MyAssetListItem', () => {
    const mockBtcAsset: MyAsset = {
        symbol: 'btc' as NetworkSymbol,
        name: 'Bitcoin',
        balance: '1000000',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(42000)),
        cryptoId: 'bitcoin' as CryptoId,
    };

    const mockEthAsset: MyAsset = {
        symbol: 'eth' as NetworkSymbol,
        name: 'Ethereum',
        balance: '1000000000000000000',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(2500)),
        cryptoId: 'ethereum' as CryptoId,
    };

    const mockUsdcTokenAsset: MyAsset = {
        symbol: 'eth' as NetworkSymbol,
        name: 'USDC',
        balance: '100000000',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(100)),
        tokenSymbol: 'USDC' as TokenSymbol,
        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
    };

    const getPreloadedState = () => ({
        wallet: {
            accounts: [getBtcAccount(), getEthAccount()],
            tradingNew: {
                info: {
                    coins: {
                        bitcoin: { symbol: 'btc', name: 'Bitcoin', cryptoId: 'bitcoin' },
                        ethereum: { symbol: 'eth', name: 'Ethereum', cryptoId: 'ethereum' },
                        'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
                            symbol: 'usdc',
                            name: 'USDC',
                            cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        },
                    },
                },
            },
        },
    });

    const renderComponent = (
        {
            onPress = jest.fn(),
            asset = mockBtcAsset,
            account = getBtcAccount(),
        }: Partial<MyAssetListItemProps> = {},
        preloadedState = getPreloadedState(),
    ) =>
        renderWithStoreProviderAsync(
            <MyAssetListItem asset={asset} account={account} onPress={onPress} />,
            { preloadedState },
        );

    it('should render with correct labels', async () => {
        const { getAllByText } = await renderComponent({
            asset: mockUsdcTokenAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('USDC').length).toBeGreaterThan(0);
        expect(getAllByText('100,000,000 USDC').length).toBeGreaterThan(0);
    });

    it('should call onPress callback when clicked', async () => {
        const onPress = jest.fn();
        const { getAllByText } = await renderComponent({ asset: mockBtcAsset, onPress });

        fireEvent.press(getAllByText('Bitcoin')[0]);

        expect(onPress).toHaveBeenCalledWith(
            expect.objectContaining({
                symbol: 'btc',
                name: 'Bitcoin',
                cryptoId: 'bitcoin',
            }),
        );
    });

    it('should render Bitcoin asset with correct labels and balance', async () => {
        const { getAllByText } = await renderComponent({ asset: mockBtcAsset });

        expect(getAllByText('Bitcoin')[0]).toBeTruthy();
        expect(getAllByText('1,000,000 BTC')[0]).toBeTruthy();
        expect(getAllByText('$42,000.00')[0]).toBeTruthy();
    });

    it('should render Ethereum asset with correct labels and balance', async () => {
        const { getAllByText } = await renderComponent({
            asset: mockEthAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('Ethereum')[0]).toBeTruthy();
        expect(getAllByText('1,000,000,000,000,000,000 ETH')[0]).toBeTruthy();
        expect(getAllByText('$2,500.00')[0]).toBeTruthy();
    });

    it('should render token asset with token formatter', async () => {
        const { getAllByText } = await renderComponent({
            asset: mockUsdcTokenAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('USDC')[0]).toBeTruthy();
        expect(getAllByText('$100.00')[0]).toBeTruthy();
        expect(getAllByText('100,000,000 USDC')[0]).toBeTruthy();
    });

    it('should not render when tradeable asset cannot be created', async () => {
        const invalidAsset: MyAsset = {
            symbol: 'btc' as NetworkSymbol,
            name: 'Invalid Asset',
            balance: '1000',
            fiatBalance: asBaseCurrencyAmount(new BigNumber(10)),
            cryptoId: undefined,
        };

        const preloadedState = {
            ...getPreloadedState(),
            appSettings: {
                isOnboardingFinished: true,
                localCurrency: 'usd',
            },
        };

        const { toJSON } = await renderComponent({ asset: invalidAsset }, preloadedState);

        expect(toJSON()).toBeNull();
    });

    it('should render without fiat balance when not available', async () => {
        const assetWithoutFiat: MyAsset = {
            ...mockBtcAsset,
            fiatBalance: null,
        };

        const { getAllByText, queryByText } = await renderComponent({
            asset: assetWithoutFiat,
        });

        expect(getAllByText('Bitcoin')[0]).toBeTruthy();
        expect(getAllByText('1,000,000 BTC')[0]).toBeTruthy();
        expect(queryByText('$42,000.00')).toBeNull();
    });

    it('should handle token assets with contract address correctly', async () => {
        const { getByText, getAllByText } = await renderComponent({
            asset: mockUsdcTokenAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('USDC').length).toBeGreaterThan(0);
        expect(getByText('100,000,000 USDC')).toBeTruthy();
        expect(getByText('$100.00')).toBeTruthy();
    });
});
