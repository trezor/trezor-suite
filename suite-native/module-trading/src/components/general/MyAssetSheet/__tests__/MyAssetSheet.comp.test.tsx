import { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { BigNumber } from '@trezor/utils';

import { getBtcAccount, getEthAccount } from '../../../../__fixtures__/account';
import { selectExchangeAccountsWithTokensSectionList } from '../../../../selectors/exchangeSelectors';
import { MyAsset } from '../../../../types/general';
import { MyAssetSheet, MyAssetSheetProps } from '../MyAssetSheet';

jest.mock('../../../../selectors/exchangeSelectors');
const mockedSelectExchangeAccountsWithTokensSectionList =
    selectExchangeAccountsWithTokensSectionList as unknown as jest.Mock;

describe('MyAssetSheet', () => {
    const btcAccount = getBtcAccount();
    const ethAccount = getEthAccount();

    const defaultAssets: MyAsset[] = [
        {
            name: 'Bitcoin',
            symbol: 'btc',
            cryptoId: 'bitcoin' as CryptoId,
            balance: '1.23',
            fiatBalance: asBaseCurrencyAmount(new BigNumber(45.6)),
        },
    ];

    const defaultAccounts = [
        {
            key: 'account1',
            sectionData: btcAccount,
            data: defaultAssets,
        },
        {
            key: 'account2',
            sectionData: { ...ethAccount },
            data: [],
        },
    ];

    const renderMyAssetsSheet = (props?: Partial<MyAssetSheetProps>) =>
        renderWithStoreProviderAsync(
            <MyAssetSheet onAssetSelect={jest.fn} onClose={jest.fn} isVisible={true} {...props} />,
        );

    it('should render account information correctly', async () => {
        mockedSelectExchangeAccountsWithTokensSectionList.mockReturnValue(defaultAccounts);

        const { getByText } = await renderMyAssetsSheet();

        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(getByText('Ethereum #1')).toBeTruthy();
    });

    it('should render correct empty component', async () => {
        mockedSelectExchangeAccountsWithTokensSectionList.mockReturnValue([]);
        const { getByText } = await renderMyAssetsSheet();

        expect(getByText('No assets found')).toBeTruthy();
        expect(getByText('You do not have any assets available for this operation.')).toBeTruthy();
    });
});
