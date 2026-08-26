import {
    mockWalletAccount,
    networkSpecificDefaultEthereum,
} from '@suite-common/wallet-types/mocks';
import { getFiatRateKey, networkAmountToSmallestUnit } from '@suite-common/wallet-utils';
import { type PreloadedState } from '@trezor/suite';
import { type DeepPartial } from '@trezor/type-utils';

/** Rate the e2e test mocked through blockbook, kept so expected fiat values stay comparable. */
export const MOCK_ETH_RATE = 0.5;

/**
 * `formattedBalance` is in ETH; `balance` and `availableBalance` are in wei, as a discovered
 * account stores them. Amount validation reads `availableBalance`, so passing ETH there silently
 * turns the balance into 2.5 wei and every amount looks like insufficient funds.
 */
export const mockEthereumStakingAccount = (formattedBalance: string) => {
    const balanceInWei = networkAmountToSmallestUnit(formattedBalance, 'eth');

    return mockWalletAccount(
        {
            symbol: 'eth',
            balance: balanceInWei,
            availableBalance: balanceInWei,
            formattedBalance,
        },
        networkSpecificDefaultEthereum,
    );
};

/**
 * The slice of wallet state `useStakeForm` reads: the account being staked, the base currency, and
 * a current fiat rate. Staking limits are constants and `amountLimits` is derived from the balance,
 * so no composed transaction — and therefore no backend — is involved.
 */
export const mockStakingWalletState = (
    account: ReturnType<typeof mockEthereumStakingAccount>,
): DeepPartial<PreloadedState> => ({
    wallet: {
        accounts: [account],
        selectedAccount: { status: 'loaded', account },
        settings: { localCurrency: 'usd', enabledNetworks: ['eth'] },
        fiat: {
            current: {
                [getFiatRateKey('eth', 'usd')]: {
                    rate: MOCK_ETH_RATE,
                    lastTickerTimestamp: 0,
                    isLoading: false,
                    error: null,
                },
            },
        },
        // `useFees` reads this; the values match the eth fixture in
        // packages/suite/src/hooks/wallet/__fixtures__/useSendForm.ts. Importing that fixture
        // instead would pull the app's component tree into the Node test process.
        fees: {
            eth: {
                status: 'loaded',
                data: {
                    minPriorityFee: 0,
                    minFee: 1,
                    maxFee: 100,
                    blockHeight: 1,
                    blockTime: 1,
                    levels: [
                        {
                            label: 'normal',
                            feePerUnit: '3300000000',
                            feeLimit: '21000',
                            blocks: -1,
                        },
                    ],
                },
            },
        },
    },
});
