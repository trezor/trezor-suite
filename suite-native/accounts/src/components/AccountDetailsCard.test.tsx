import { toTokenAddress } from '@suite-common/tokens';
import { mockStakeRootState } from '@suite-common/wallet-core/mocks';
import { type CurrentRate, type Timestamp } from '@suite-common/wallet-types';
import { mockAccountToken, mockEthereumStakingAccount } from '@suite-common/wallet-types/mocks';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { AccountDetailsCard } from './AccountDetailsCard';

jest.mock('@suite-native/icons', () => ({
    ...jest.requireActual('@suite-native/icons'),
    Icon: () => null,
    TokenIcon: () => null,
}));

jest.mock('./AccountLabel', () => ({
    AccountLabel: () => null,
}));

const contract = toTokenAddress('0x' + 'a'.repeat(40));
const account = mockEthereumStakingAccount('active', {
    tokens: [mockAccountToken({ contract, balance: '250' })],
});

const createRate = (rate: number): CurrentRate => ({
    ticker: { symbol: account.symbol },
    lastTickerTimestamp: 1700000000000 as Timestamp,
    lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
    isLoading: false,
    error: null,
    rate,
    usdRate: rate,
});

const renderCard = () =>
    renderWithStoreProvider(<AccountDetailsCard accountKey={account.key} />, {
        preloadedState: {
            device: mockStakeRootState({ accounts: [account] }).device,
            wallet: {
                accounts: [account],
                settings: { localCurrency: 'usd' },
                fiat: {
                    current: {
                        [getFiatRateKey(account.symbol, 'usd')]: createRate(2000),
                        [getFiatRateKey(account.symbol, 'usd', contract)]: createRate(1),
                    },
                },
            },
            tokenDefinitions: {
                [account.symbol]: {
                    coin: { data: [contract], hide: [], show: [], error: false, isLoading: false },
                },
            },
        },
    });

describe('AccountDetailsCard', () => {
    it('shows only the liquid native balance of an account with tokens and staking', async () => {
        const { getByText, queryByText, getByLabelText, getByTestId } = await renderCard();

        expect(getByText(/3,000/)).toBeOnTheScreen();
        expect(queryByText(/7,350/)).not.toBeOnTheScreen();
        expect(getByTestId('@accountList/item/native-balance')).toBeOnTheScreen();
        expect(
            getByLabelText(getTranslation('accountList.numberOfTokens', { numberOfTokens: 1 })),
        ).toBeOnTheScreen();
    });
});
