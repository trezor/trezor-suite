import type { CryptoId } from 'invity-api';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type TokenAddress,
    type TokenSymbol,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProvider } from '@suite-native/test-utils';
import { getBtcAccount, getEthAccount } from '@suite-native/trading-fixtures';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { MyAssetListItem, type MyAssetListItemProps } from '../MyAssetListItem';

describe('MyAssetListItem', () => {
    const mockBtcAsset: MyAsset = {
        symbol: 'btc' as NetworkSymbol,
        name: 'Bitcoin',
        balance: '1000000',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(42000)),
        cryptoId: 'bitcoin' as CryptoId,
        isEnabled: true,
    };

    const mockEthAsset: MyAsset = {
        symbol: 'eth' as NetworkSymbol,
        name: 'Ethereum',
        balance: '1000000000000000000',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(2500)),
        cryptoId: 'ethereum' as CryptoId,
        isEnabled: true,
    };

    const mockUsdcTokenAsset: MyAsset = {
        symbol: 'eth' as NetworkSymbol,
        name: 'USDC',
        balance: '100000000',
        fiatBalance: asBaseCurrencyAmount(new BigNumber(100)),
        tokenSymbol: 'USDC' as TokenSymbol,
        contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress,
        cryptoId: 'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CryptoId,
        isEnabled: true,
    };

    const getPreloadedState = () => ({
        wallet: {
            accounts: [getBtcAccount(), getEthAccount()],
            trading: {
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
                exchange: {
                    exchangeInfo: {
                        sellCryptoIds: [
                            'bitcoin',
                            'ethereum',
                            'ethereum--0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        ],
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
        renderWithStoreProvider(
            <MyAssetListItem asset={asset} account={account} onPress={onPress} />,
            { preloadedState },
        );

    it('should render with correct labels', () => {
        const { getAllByText } = renderComponent({
            asset: mockUsdcTokenAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('USDC').length).toBeGreaterThan(0);
        expect(getAllByText('100,000,000 USDC').length).toBeGreaterThan(0);
    });

    it('should call onPress callback when clicked', () => {
        const onPress = jest.fn();
        const { getAllByText } = renderComponent({ asset: mockBtcAsset, onPress });

        fireEvent.press(getAllByText('Bitcoin')[0]);

        expect(onPress).toHaveBeenCalledWith(
            expect.objectContaining({
                symbol: 'BTC',
                name: 'Bitcoin',
                cryptoId: 'bitcoin',
            }),
            getBtcAccount(),
        );
    });

    it('should render Bitcoin asset with correct labels and balance', () => {
        const { getAllByText } = renderComponent({ asset: mockBtcAsset });

        expect(getAllByText('Bitcoin')[0]).toBeTruthy();
        expect(getAllByText('1,000,000 BTC')[0]).toBeTruthy();
        expect(getAllByText('$42,000.00')[0]).toBeTruthy();
    });

    it('should render Ethereum asset with correct labels and balance', () => {
        const { getAllByText } = renderComponent({
            asset: mockEthAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('Ethereum')[0]).toBeTruthy();
        expect(getAllByText('1,000,000,000,000,000,000 ETH')[0]).toBeTruthy();
        expect(getAllByText('$2,500.00')[0]).toBeTruthy();
    });

    it('should render token asset with token formatter', () => {
        const { getAllByText } = renderComponent({
            asset: mockUsdcTokenAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('USDC')[0]).toBeTruthy();
        expect(getAllByText('$100.00')[0]).toBeTruthy();
        expect(getAllByText('100,000,000 USDC')[0]).toBeTruthy();
    });

    it('should render as no pair when not enabled', () => {
        const preloadedState = {
            ...getPreloadedState(),
            appSettings: {
                isOnboardingFinished: true,
                localCurrency: 'usd',
            },
        };

        const { getByText } = renderComponent(
            { asset: { ...mockEthAsset, isEnabled: false } },
            preloadedState,
        );

        expect(getByText('No pair')).toBeTruthy();
    });

    it('should render without fiat balance when not available', () => {
        const assetWithoutFiat: MyAsset = {
            ...mockBtcAsset,
            fiatBalance: null,
        };

        const { getAllByText, queryByText } = renderComponent({
            asset: assetWithoutFiat,
        });

        expect(getAllByText('Bitcoin')[0]).toBeTruthy();
        expect(getAllByText('1,000,000 BTC')[0]).toBeTruthy();
        expect(queryByText('$42,000.00')).toBeNull();
    });

    it('should handle token assets with contract address correctly', () => {
        const { getByText, getAllByText } = renderComponent({
            asset: mockUsdcTokenAsset,
            account: getEthAccount(),
        });

        expect(getAllByText('USDC').length).toBeGreaterThan(0);
        expect(getByText('100,000,000 USDC')).toBeTruthy();
        expect(getByText('$100.00')).toBeTruthy();
    });

    describe('handlePress functionality', () => {
        it('should call onPress when asset is enabled and tradeableAsset exists', () => {
            const onPress = jest.fn();
            const { getAllByText } = renderComponent({
                asset: mockBtcAsset,
                onPress,
            });

            fireEvent.press(getAllByText('Bitcoin')[0]);

            expect(onPress).toHaveBeenCalledWith(
                expect.objectContaining({
                    symbol: 'BTC',
                    name: 'Bitcoin',
                    cryptoId: 'bitcoin',
                }),
                expect.objectContaining({
                    key: 'btc-account-1',
                }),
            );
        });

        it('should  not call onPress when asset is not enabled', () => {
            const onPress = jest.fn();
            const disabledAsset = { ...mockBtcAsset, isEnabled: false };
            const { getAllByText } = renderComponent({
                asset: disabledAsset,
                onPress,
            });

            fireEvent.press(getAllByText('Bitcoin')[0]);

            expect(onPress).not.toHaveBeenCalled();
        });

        it('should  not call onPress when tradeableAsset does not exist (no cryptoId)', () => {
            const onPress = jest.fn();
            const assetWithoutCryptoId = { ...mockBtcAsset, cryptoId: undefined };
            const { getAllByText } = renderComponent({
                asset: assetWithoutCryptoId,
                onPress,
            });

            fireEvent.press(getAllByText('Bitcoin')[0]);

            expect(onPress).not.toHaveBeenCalled();
        });

        it('should  not call onPress when coinInfo does not exist in store', () => {
            const onPress = jest.fn();
            const preloadedStateWithoutCoinInfo = {
                wallet: {
                    accounts: [getBtcAccount(), getEthAccount()],
                    trading: {
                        info: {
                            coins: {}, // Empty coins object
                        },
                        exchange: {
                            exchangeInfo: {
                                sellCryptoIds: [],
                            },
                        },
                    },
                },
            };

            const { getAllByText } = renderComponent(
                {
                    asset: mockBtcAsset,
                    onPress,
                },
                preloadedStateWithoutCoinInfo as any,
            );

            fireEvent.press(getAllByText('Bitcoin')[0]);

            expect(onPress).not.toHaveBeenCalled();
        });

        it('should not call onPress when asset is not enabled and tradeableAsset does not exist', () => {
            const onPress = jest.fn();
            const disabledAssetWithoutCryptoId = {
                ...mockBtcAsset,
                isEnabled: false,
                cryptoId: undefined,
            };
            const { getAllByText } = renderComponent({
                asset: disabledAssetWithoutCryptoId,
                onPress,
            });

            fireEvent.press(getAllByText('Bitcoin')[0]);

            expect(onPress).not.toHaveBeenCalled();
        });
    });
});
