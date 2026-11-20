import { type CryptoId } from 'invity-api';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import { toTokenAddress, toTokenSymbol } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { mockAccountToken } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { fireEvent } from '@suite-native/test-utils-store';
import { eth1NormalAccount } from '@suite-native/trading-fixtures';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { MyAssetList } from './MyAssetList';
import { type MyAssetsSection } from '../../../hooks/general/useMyAssetsFilteredData';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

const createAsset = (name: string, contract: string, isEnabled = true): MyAsset => ({
    name,
    symbol: asNetworkSymbol('eth'),
    cryptoId: `ethereum--${contract}` as CryptoId,
    contract: toTokenAddress(contract),
    tokenSymbol: toTokenSymbol(name.toUpperCase()),
    balance: '1',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('0.01')),
    isEnabled,
});

const regularAsset = createAsset('Regular', '0x0000000000000000000000000000000000000001');
const lowBalanceAsset = createAsset('Low', '0x0000000000000000000000000000000000000002');
const nonTradeableAsset = createAsset(
    'Disabled',
    '0x0000000000000000000000000000000000000003',
    false,
);

// The list resolves token names from the accounts, which hold the assets it lists.
const account = {
    ...eth1NormalAccount,
    tokens: [regularAsset, lowBalanceAsset, nonTradeableAsset].map(asset =>
        mockAccountToken({ contract: asset.contract, name: asset.name }),
    ),
};

const section: MyAssetsSection = {
    key: account.key,
    label: 'Ethereum #1',
    sectionData: account,
    assets: [regularAsset],
    lowBalanceAssets: [lowBalanceAsset],
    nonTradeableAssets: [nonTradeableAsset],
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
            {
                overrides: { wallet: { accounts: [account] } },
                services: { networks: mockNetworksServices() },
            },
        );

    it('expands low-balance and non-tradeable groups independently', async () => {
        const { getByTestId, getByText } = await renderList();
        const lowBalanceTestID = `${testID}/${eth1NormalAccount.key}/low-balance`;
        const nonTradeableTestID = `${testID}/${eth1NormalAccount.key}/non-tradeable`;

        expect(getByText('Regular')).toBeOnTheScreen();
        expect(getByTestId(`${lowBalanceTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });
        expect(getByTestId(`${nonTradeableTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });

        await fireEvent.press(getByTestId(`${lowBalanceTestID}/toggle`));

        expect(getByTestId(`${lowBalanceTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByTestId(`${nonTradeableTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: false,
        });

        await fireEvent.press(getByTestId(`${nonTradeableTestID}/toggle`));

        expect(getByTestId(`${lowBalanceTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByTestId(`${nonTradeableTestID}/toggle`).props.accessibilityState).toEqual({
            expanded: true,
        });
        expect(getByText('Disabled')).toBeDisabled();
    });

    it('renders the existing empty-state copy', async () => {
        const { getByText } = await renderList([]);

        expect(
            getByText(getTranslation('moduleTrading.myAssetScreen.emptyTitle')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.myAssetScreen.emptyDescription')),
        ).toBeOnTheScreen();
    });
});
