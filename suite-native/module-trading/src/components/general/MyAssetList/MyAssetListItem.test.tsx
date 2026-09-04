import type { CryptoId } from 'invity-api';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { MyAssetListItem } from './MyAssetListItem';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const createAsset = (overrides: Partial<MyAsset> = {}): MyAsset => ({
    name: 'Ethereum',
    symbol: asNetworkSymbol('eth'),
    cryptoId: 'ethereum' as CryptoId,
    balance: '0.00000081',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')),
    isEnabled: true,
    ...overrides,
});

describe('MyAssetListItem', () => {
    it('renders compact crypto balance when fiat balance is available', async () => {
        const { getByText } = await renderWithTradingProvider(
            <MyAssetListItem
                asset={createAsset({
                    balance: '0.051969631491352025',
                    fiatBalance: asBaseCurrencyAmount(new BigNumber('130.25')),
                })}
                onPress={jest.fn()}
            />,
        );

        expect(getByText('0.05196 ETH')).toBeOnTheScreen();
    });

    it('renders compact crypto balance even when fiat balance is not available', async () => {
        const { getByText } = await renderWithTradingProvider(
            <MyAssetListItem
                asset={createAsset({
                    fiatBalance: null,
                })}
                onPress={jest.fn()}
            />,
        );

        expect(getByText('<0.00001 ETH')).toBeOnTheScreen();
    });

    it('renders compact token balance even when fiat balance is not available', async () => {
        const { getByText } = await renderWithTradingProvider(
            <MyAssetListItem
                asset={createAsset({
                    name: 'USD Coin',
                    balance: '1.5',
                    fiatBalance: null,
                    tokenSymbol: 'USDC' as TokenSymbol,
                    decimals: 6,
                })}
                onPress={jest.fn()}
            />,
        );

        expect(getByText('1.50 USDC')).toBeOnTheScreen();
    });

    it('renders 6-decimal token balance money-like when fiat balance is available', async () => {
        const { getByText, queryByText } = await renderWithTradingProvider(
            <MyAssetListItem
                asset={createAsset({
                    name: 'USD Coin',
                    balance: '23.910287',
                    fiatBalance: asBaseCurrencyAmount(new BigNumber('23.91')),
                    tokenSymbol: 'USDC' as TokenSymbol,
                    decimals: 6,
                })}
                onPress={jest.fn()}
            />,
        );

        expect(getByText('23.91 USDC')).toBeOnTheScreen();
        expect(queryByText('23.910287 USDC')).toBeNull();
    });
});
