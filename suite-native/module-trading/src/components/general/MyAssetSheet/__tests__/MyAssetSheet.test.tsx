import type { CryptoId } from 'invity-api';

import { selectFormattedAccountType } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { fireEvent, renderWithStoreProviderAsync, screen } from '@suite-native/test-utils';
import {
    btc1NormalAccount,
    eth1NormalAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { selectAccountsWithTokensToSellSectionCondensedListByTradingType } from '@suite-native/trading-state';
import { type MyAssetTradeable } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { TEST_ID_ACCOUNT_TYPE_BADGE } from '../MyAssetListSectionHeader';
import { MyAssetSheet, type MyAssetSheetProps } from '../MyAssetSheet';

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionCondensedListByTradingType: jest.fn(),
}));
const mockedSelectAccountsWithTokensToSellSectionListByTradingType =
    selectAccountsWithTokensToSellSectionCondensedListByTradingType as unknown as jest.Mock;

// Mock the selectFormattedAccountType selector
jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectFormattedAccountType: jest.fn(),
}));

const mockedSelectFormattedAccountType = selectFormattedAccountType as unknown as jest.Mock;

describe('MyAssetSheet', () => {
    const btcAccount = btc1NormalAccount;
    const ethAccount = eth1NormalAccount;

    const defaultAssets: MyAssetTradeable[] = [
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

    const getPreloadedState = () => ({
        wallet: {
            trading: getInitializedTradingState(),
            accounts: [btcAccount, ethAccount],
        },
    });

    const renderMyAssetsSheet = (props?: Partial<MyAssetSheetProps>) =>
        renderWithStoreProviderAsync(
            <MyAssetSheet
                onAssetSelect={jest.fn}
                onClose={jest.fn}
                isVisible={true}
                tradingType="exchange"
                {...props}
            />,
            { preloadedState: getPreloadedState() },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation - return null for most accounts
        mockedSelectFormattedAccountType.mockReturnValue(null);
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render account information correctly', async () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );

        const { getByText } = await renderMyAssetsSheet();

        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(getByText('ETH Account #1')).toBeTruthy();
    });

    it('should render correct empty component', async () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue([]);
        const { getByText } = await renderMyAssetsSheet();

        expect(getByText('No assets found')).toBeTruthy();
        expect(getByText('You do not have any assets available for this operation.')).toBeTruthy();
    });

    it('should select asset and close on asset item press', async () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
        const onAssetSelect = jest.fn();
        const onClose = jest.fn();

        const { getByText } = await renderMyAssetsSheet({ onAssetSelect, onClose });

        fireEvent.press(getByText('BTC'));

        expect(onAssetSelect).toHaveBeenCalledTimes(1);
        expect(onAssetSelect).toHaveBeenCalledWith(
            expect.objectContaining({ cryptoId: 'bitcoin' }),
            btcAccount,
        );

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledWith(false);
    });

    it('should render formatted account type badge when defined', async () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );

        // Mock the selector to return a formatted account type for the first account
        mockedSelectFormattedAccountType.mockImplementation((_state, accountKey) =>
            accountKey === btcAccount.key ? 'SegWit' : null,
        );

        const { getByText } = await renderMyAssetsSheet();

        expect(getByText('SegWit')).toBeTruthy();
    });

    it('should not render badge when formatted account type is null', async () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );

        // Mock the selector to return null for all accounts
        mockedSelectFormattedAccountType.mockReturnValue(null);

        const { queryByTestId } = await renderMyAssetsSheet();

        expect(queryByTestId(TEST_ID_ACCOUNT_TYPE_BADGE)).toBeNull();
    });
});
