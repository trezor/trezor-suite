import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { fireEvent } from '@suite-native/test-utils-store';
import { btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { BigNumber } from '@trezor/utils';

import { TradeableAssetListItem, type TradeableAssetListItemProps } from './TradeableAssetListItem';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('TradeableAssetListItem', () => {
    const renderComponent = async ({
        onPress = jest.fn(),
        asset = btcAsset,
        balance,
    }: Partial<TradeableAssetListItemProps>) =>
        await renderWithTradingProvider(
            <TradeableAssetListItem asset={asset} balance={balance} onPress={onPress} />,
        );

    it('should render with correct labels', async () => {
        const { getAllByText } = await renderComponent({ asset: usdcAsset });

        expect(getAllByText('USDC').length).toBeGreaterThan(0);
        expect(getAllByText('Ethereum').length).toBeGreaterThan(0);
    });

    it('should call onPress callback when clicked', async () => {
        const onPress = jest.fn();
        const { getByText } = await renderComponent({ asset: btcAsset, onPress });

        await fireEvent.press(getByText('BTC'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('displays the total fiat and crypto balances', async () => {
        const { getByText } = await renderComponent({
            asset: btcAsset,
            balance: {
                cryptoAmount: '0.5',
                fiatAmount: asBaseCurrencyAmount(new BigNumber('42000')),
            },
        });

        expect(getByText(/42,000/)).toBeTruthy();
        expect(getByText(/0\.5.*BTC/)).toBeTruthy();
    });
});
