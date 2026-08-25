import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';
import { eth1NormalAccount } from '@suite-native/trading-fixtures';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { MyAssetList } from './MyAssetList';
import { type MyAssetsSection } from '../../../hooks/general/useMyAssetsFilteredData';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const createAsset = (name: string, isEnabled = true): MyAsset => ({
    name,
    symbol: 'eth',
    cryptoId: `ethereum--${name.toLowerCase()}` as CryptoId,
    balance: '1',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')),
    isEnabled,
});

const regularAsset = createAsset('Regular');
const lowBalanceAsset = createAsset('Low');
const nonTradableAsset = createAsset('Disabled', false);

const section: MyAssetsSection = {
    key: eth1NormalAccount.key,
    label: 'Ethereum #1',
    sectionData: eth1NormalAccount,
    assets: [regularAsset],
    lowBalanceAssets: [lowBalanceAsset],
    nonTradableAssets: [nonTradableAsset],
};

describe('MyAssetList', () => {
    const testID = '@trading/sell/send-asset-screen';

    const renderList = (assets: MyAssetsSection[] = [section]) =>
        renderWithTradingProvider(
            <MyAssetList
                assets={assets}
                onAssetSelect={jest.fn()}
                onFilterChange={jest.fn()}
                onSelectedNetworkFilter={jest.fn()}
                scrollResetKey="test"
                selectedNetworkFilter={undefined}
                testID={testID}
            />,
        );

    it('expands low-balance and non-tradeable groups independently', () => {
        const { getByTestId, getByText } = renderList();
        const lowBalanceTestID = `${testID}/${eth1NormalAccount.key}/low-balance`;
        const nonTradeableTestID = `${testID}/${eth1NormalAccount.key}/non-tradeable`;

        expect(getByText('Regular')).toBeOnTheScreen();
        expect(getByTestId(`${lowBalanceTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });
        expect(getByTestId(`${nonTradeableTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });

        fireEvent.press(getByTestId(`${lowBalanceTestID}/toggle`));

        expect(getByTestId(`${lowBalanceTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByTestId(`${nonTradeableTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });

        fireEvent.press(getByTestId(`${nonTradeableTestID}/toggle`));

        expect(getByTestId(`${lowBalanceTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByTestId(`${nonTradeableTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByText('Disabled')).toBeDisabled();
    });

    it('renders the existing empty-state copy', () => {
        const { getByText } = renderList([]);

        expect(
            getByText(getTranslation('moduleTrading.myAssetScreen.emptyTitle')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.myAssetScreen.emptyDescription')),
        ).toBeOnTheScreen();
    });
});
