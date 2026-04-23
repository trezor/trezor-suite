import type { CryptoId } from 'invity-api';

import { selectFormattedAccountType } from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { fireEvent, screen } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    eth1NormalAccount,
    getInitializedTradingState,
} from '@suite-native/trading-fixtures';
import { selectAccountsWithTokensToSellSectionCondensedListByTradingType } from '@suite-native/trading-state';
import { type MyAssetTradeable } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
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

    const getOverrides = () => ({
        wallet: {
            trading: getInitializedTradingState(),
            accounts: [btcAccount, ethAccount],
        },
    });

    const renderMyAssetsSheet = (props?: Partial<MyAssetSheetProps>) =>
        renderWithTradingProvider(
            <MyAssetSheet
                onAssetSelect={jest.fn}
                onClose={jest.fn}
                isVisible={true}
                tradingType="exchange"
                {...props}
            />,
            {
                overrides: getOverrides(),
                providers: ['intl', 'formatter', 'bottomSheet'],
            },
        );

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation - return null for most accounts
        mockedSelectFormattedAccountType.mockReturnValue(null);
    });

    afterEach(() => {
        screen.unmount();
    });

    it('should render account information correctly', () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );

        const { getByText } = renderMyAssetsSheet();

        expect(getByText('BTC Account #1')).toBeTruthy();
        expect(getByText('ETH Account #1')).toBeTruthy();
    });

    it('should render correct empty component', () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue([]);
        const { getByText } = renderMyAssetsSheet();

        expect(getByText('No assets found')).toBeTruthy();
        expect(getByText('You do not have any assets available for this operation.')).toBeTruthy();
    });

    it('should select asset and close on asset item press', () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );
        const onAssetSelect = jest.fn();
        const onClose = jest.fn();

        const { getByText } = renderMyAssetsSheet({ onAssetSelect, onClose });

        fireEvent.press(getByText('BTC'));

        expect(onAssetSelect).toHaveBeenCalledTimes(1);
        expect(onAssetSelect).toHaveBeenCalledWith(
            expect.objectContaining({ cryptoId: 'bitcoin' }),
            btcAccount,
        );

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledWith(false);
    });

    it('should render formatted account type badge when defined', () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );

        // Mock the selector to return a formatted account type for the first account
        mockedSelectFormattedAccountType.mockImplementation((_state, accountKey) =>
            accountKey === btcAccount.key ? 'SegWit' : null,
        );

        const { getByText } = renderMyAssetsSheet();

        expect(getByText('SegWit')).toBeTruthy();
    });

    it('should not render badge when formatted account type is null', () => {
        mockedSelectAccountsWithTokensToSellSectionListByTradingType.mockReturnValue(
            defaultAccounts,
        );

        // Mock the selector to return null for all accounts
        mockedSelectFormattedAccountType.mockReturnValue(null);

        const { queryByTestId } = renderMyAssetsSheet();

        expect(queryByTestId(TEST_ID_ACCOUNT_TYPE_BADGE)).toBeNull();
    });
});
