import { type DeviceRootState } from '@suite-common/device';
import {
    type NotificationsRootState,
    type TransactionNotification,
} from '@suite-common/toast-notifications';
import {
    DUST_PHISHING_THRESHOLD,
    type TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import {
    type Account,
    type AccountKey,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { type TransactionsRootState } from './transactionsReducerTypes';
import {
    selectEvmPrivatePendingHint,
    selectHasUnseenNonPhishingTransactionNotifications,
    selectNonPhishingTransactionNotifications,
    selectTransactionsWithMissingRates,
} from './transactionsSelectors';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { type FiatRatesRootState } from '../fiat-rates/fiatRatesTypes';
import { type PhishingRootState } from '../phishing/phishingReducerTypes';

const ACCOUNT_KEY = 'descriptor-eth-device' as AccountKey;
const LOCAL_CURRENCY = 'usd' as BaseCurrencyCode;

const USDT_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as TokenAddress;
const VAULT_CONTRACT = '0xbeef69b8fea9a16fb98a661860f6d78d94e1b000' as TokenAddress;

const HOUR_ALIGNED_TIMESTAMP = 1700002800;

const ethAccount = {
    key: ACCOUNT_KEY,
    symbol: 'eth',
    tokens: [
        { contract: USDT_CONTRACT, decimals: 6 },
        { contract: VAULT_CONTRACT, decimals: 6, protocols: ['erc4626'] },
    ],
} as unknown as Account;

const tokenTransaction = (contract: TokenAddress): WalletAccountTransaction =>
    ({
        txid: `tx-${contract}`,
        symbol: 'eth',
        blockTime: HOUR_ALIGNED_TIMESTAMP,
        tokens: [{ contract, standard: 'ERC20', amount: '1000000', decimals: 6 }],
    }) as unknown as WalletAccountTransaction;

type State = TransactionsRootState & FiatRatesRootState & AccountsRootState;

const getState = (transactions: WalletAccountTransaction[]): State =>
    ({
        wallet: {
            transactions: { transactions: { [ACCOUNT_KEY]: transactions } },
            fiat: {
                historic: {
                    // Rate of the native coin is always present, so only token rates decide.
                    'eth-usd': { [HOUR_ALIGNED_TIMESTAMP]: 2000 },
                },
            },
            accounts: [ethAccount],
        },
    }) as unknown as State;

describe('selectTransactionsWithMissingRates', () => {
    it('reports a transaction with a missing token rate', () => {
        const result = selectTransactionsWithMissingRates(
            getState([tokenTransaction(USDT_CONTRACT)]),
            LOCAL_CURRENCY,
        );

        expect(result).toHaveLength(1);
        expect(result[0]?.txs.map(tx => tx.txid)).toEqual([`tx-${USDT_CONTRACT}`]);
    });

    it('does not report a transaction whose only rateless transfer is an ERC4626 token', () => {
        const result = selectTransactionsWithMissingRates(
            getState([tokenTransaction(VAULT_CONTRACT)]),
            LOCAL_CURRENCY,
        );

        expect(result).toHaveLength(0);
    });
});

describe('selectEvmPrivatePendingHint', () => {
    const HINT_ACCOUNT_KEY = 'account-hint' as AccountKey;

    const HINT_DESCRIPTOR = '0x37567E60ab231b7D7f26B5b34FDD719098E4Ee1b';

    // The hint declares the account's *own* pending txs, which is decided by authorship (an input
    // belonging to the account), not by the display type — see isSignedByAccount.
    const pendingSentTx = (nonce: number): WalletAccountTransaction =>
        ({
            txid: `pending-${nonce}`,
            type: 'sent',
            blockHeight: -1,
            descriptor: HINT_DESCRIPTOR,
            ethereumSpecific: { nonce },
            details: { vin: [{ addresses: [HINT_DESCRIPTOR], isAccountOwned: true }] },
        }) as unknown as WalletAccountTransaction;

    const getHintState = (
        transactions: WalletAccountTransaction[],
    ): TransactionsRootState & AccountsRootState =>
        ({
            wallet: {
                transactions: { transactions: { [HINT_ACCOUNT_KEY]: transactions } },
            },
        }) as unknown as TransactionsRootState & AccountsRootState;

    it('returns the sorted nonces and txids of all local pending sent txs', () => {
        const state = getHintState([pendingSentTx(7), pendingSentTx(6)]);
        expect(selectEvmPrivatePendingHint(state, HINT_ACCOUNT_KEY)).toEqual({
            nonces: [6, 7],
            txids: ['pending-6', 'pending-7'],
        });
    });

    it('returns undefined when the account has no transactions', () => {
        const state = getHintState([pendingSentTx(7)]);
        expect(selectEvmPrivatePendingHint(state, 'missing-account' as AccountKey)).toBeUndefined();
    });
});

describe('selectNonPhishingTransactionNotifications', () => {
    const PHISHING_ACCOUNT_KEY = 'phishing-eth-account' as AccountKey;
    const DEVICE_STATE = 'phishing-device-session';
    const DESCRIPTOR = '0x37567E60ab231b7D7f26B5b34FDD719098E4Ee1b';

    const ETH_USD_RATE = 2000;

    // 5e11 wei is 0.001 USD at the rate above, a fifth of the dust threshold. 1e16 wei is 20 USD.
    const DUST_AMOUNT_IN_WEI = '500000000000';
    const MEANINGFUL_AMOUNT_IN_WEI = '10000000000000000';

    const phishingEthAccount = {
        key: PHISHING_ACCOUNT_KEY,
        symbol: 'eth',
        descriptor: DESCRIPTOR,
        deviceState: DEVICE_STATE,
    } as unknown as Account;

    const receivedTransaction = (amount: string): WalletAccountTransaction =>
        ({
            txid: 'received-tx',
            symbol: 'eth',
            type: 'recv',
            amount,
            blockTime: HOUR_ALIGNED_TIMESTAMP,
            tokens: [],
            internalTransfers: [],
        }) as unknown as WalletAccountTransaction;

    const receivedNotification: TransactionNotification = {
        context: 'event',
        type: 'tx-received',
        id: 1,
        seen: false,
        descriptor: DESCRIPTOR,
        symbol: 'eth',
        txid: 'received-tx',
        formattedAmount: '0.0000005 ETH',
    } as TransactionNotification;

    type PhishingState = NotificationsRootState &
        TokenDefinitionsRootState &
        TransactionsRootState &
        AccountsRootState &
        FiatRatesRootState &
        PhishingRootState &
        DeviceRootState;
    type GetPhishingStateParams = {
        amount: string;
        isDustPhishingEnabled?: boolean;
    };

    const getPhishingState = ({
        amount,
        isDustPhishingEnabled = true,
    }: GetPhishingStateParams): PhishingState =>
        ({
            notifications: [receivedNotification],
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            // ETH declares the coin-definitions feature, so an entry is required here or
            // phishing detection bails out early.
            tokenDefinitions: { eth: {} },
            wallet: {
                accounts: [phishingEthAccount],
                transactions: {
                    transactions: { [PHISHING_ACCOUNT_KEY]: [receivedTransaction(amount)] },
                    phishing: {},
                },
                fiat: { historic: { 'eth-usd': { [HOUR_ALIGNED_TIMESTAMP]: ETH_USD_RATE } } },
                phishing: {
                    dustPhishing: {
                        isEnabled: isDustPhishingEnabled,
                        dustThreshold: DUST_PHISHING_THRESHOLD,
                    },
                },
            },
        }) as unknown as PhishingState;

    it('omits a notification whose transaction moves a dust-sized amount', () => {
        const state = getPhishingState({ amount: DUST_AMOUNT_IN_WEI });

        expect(selectNonPhishingTransactionNotifications(state)).toEqual([]);
        expect(selectHasUnseenNonPhishingTransactionNotifications(state)).toBe(false);
    });

    it('keeps a notification whose transaction moves a meaningful amount', () => {
        const state = getPhishingState({ amount: MEANINGFUL_AMOUNT_IN_WEI });

        expect(selectNonPhishingTransactionNotifications(state)).toEqual([receivedNotification]);
        expect(selectHasUnseenNonPhishingTransactionNotifications(state)).toBe(true);
    });

    it('keeps a dust notification when the user turned dust phishing detection off', () => {
        const state = getPhishingState({
            amount: DUST_AMOUNT_IN_WEI,
            isDustPhishingEnabled: false,
        });

        expect(selectNonPhishingTransactionNotifications(state)).toEqual([receivedNotification]);
        expect(selectHasUnseenNonPhishingTransactionNotifications(state)).toBe(true);
    });
});
