import { CryptoId } from 'invity-api';

import { selectFormattedAccountType } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { BigNumber } from '@trezor/utils';

import { getBtcAccount, getEthAccount } from '../../../../__fixtures__/account';
import { selectExchangeAccountsWithTokensSectionList } from '../../../../selectors/exchangeSelectors';
import { MyAsset } from '../../../../types/general';
import { TEST_ID_ACCOUNT_TYPE_BADGE } from '../MyAssetListSectionHeader';
import { MyAssetSheet, MyAssetSheetProps } from '../MyAssetSheet';

jest.mock('../../../../selectors/exchangeSelectors');
const mockedSelectExchangeAccountsWithTokensSectionList =
    selectExchangeAccountsWithTokensSectionList as unknown as jest.Mock;

// Mock the selectFormattedAccountType selector
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectFormattedAccountType: jest.fn(),
}));

const mockedSelectFormattedAccountType = selectFormattedAccountType as unknown as jest.Mock;

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
            isEnabled: true,
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

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation - return null for most accounts
        mockedSelectFormattedAccountType.mockReturnValue(null);
    });

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

    it('should render formatted account type badge when defined', async () => {
        mockedSelectExchangeAccountsWithTokensSectionList.mockReturnValue(defaultAccounts);

        // Mock the selector to return a formatted account type for the first account
        mockedSelectFormattedAccountType.mockImplementation((_state, accountKey) =>
            accountKey === 'btc-account-1' ? 'SegWit' : null,
        );

        const { getByText } = await renderMyAssetsSheet();

        expect(getByText('SegWit')).toBeTruthy();
    });

    it('should not render badge when formatted account type is null', async () => {
        mockedSelectExchangeAccountsWithTokensSectionList.mockReturnValue(defaultAccounts);

        // Mock the selector to return null for all accounts
        mockedSelectFormattedAccountType.mockReturnValue(null);

        const { queryByTestId } = await renderMyAssetsSheet();

        expect(queryByTestId(TEST_ID_ACCOUNT_TYPE_BADGE)).toBeNull();
    });
});
