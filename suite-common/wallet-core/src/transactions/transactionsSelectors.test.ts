import { type DeviceRootState } from '@suite-common/device';
import { asNetworkSymbol } from '@suite-common/networks';
import { testMocks } from '@suite-common/test-utils';
import {
    type NotificationsRootState,
    type TransactionNotification,
} from '@suite-common/toast-notifications';
import {
    DUST_PHISHING_THRESHOLD,
    type TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { type TronTxContractType } from '@suite-common/wallet-constants';
import {
    type Account,
    type AccountKey,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { transactionsInitialState } from './transactionsReducer';
import { type TransactionsRootState } from './transactionsReducerTypes';
import {
    selectAccountStakeTypeTransactions,
    selectEvmPrivatePendingHint,
    selectHasUnseenNonPhishingTransactionNotifications,
    selectNonPhishingTransactionNotifications,
} from './transactionsSelectors';
import { type AccountsRootState, accountsInitialState } from '../accounts/accountsReducer';
import { type FiatRatesHistoricRootState } from '../fiat-rates/fiatRatesTypes';
import { type PhishingRootState } from '../phishing/phishingReducerTypes';

const HOUR_ALIGNED_TIMESTAMP = 1700002800;

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
        amount: '0.0000005',
    } as TransactionNotification;

    type PhishingState = NotificationsRootState &
        TokenDefinitionsRootState &
        TransactionsRootState &
        AccountsRootState &
        FiatRatesHistoricRootState &
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

describe('selectAccountStakeTypeTransactions', () => {
    const TRON_ACCOUNT_KEY = mockAccountKey({ symbol: asNetworkSymbol('trx') });

    const tronTx = (contractType: TronTxContractType) =>
        testMocks.getWalletTransaction({
            txid: `tron-${contractType}`,
            symbol: asNetworkSymbol('trx'),
            type: 'self',
            tronSpecific: { contractType },
        });

    const getTronState = (transactions: WalletAccountTransaction[]): TransactionsRootState => ({
        wallet: {
            transactions: {
                ...transactionsInitialState,
                transactions: { [TRON_ACCOUNT_KEY]: transactions },
            },
            accounts: accountsInitialState,
        },
    });

    it('keeps Tron staking transactions', () => {
        const state = getTronState([
            tronTx('FreezeBalanceV2Contract'),
            tronTx('UnfreezeBalanceV2Contract'),
            tronTx('VoteWitnessContract'),
            tronTx('WithdrawExpireUnfreezeContract'),
            tronTx('WithdrawBalanceContract'),
        ]);

        expect(
            selectAccountStakeTypeTransactions(state, TRON_ACCOUNT_KEY).map(tx => tx.txid),
        ).toEqual([
            'tron-FreezeBalanceV2Contract',
            'tron-UnfreezeBalanceV2Contract',
            'tron-VoteWitnessContract',
            'tron-WithdrawExpireUnfreezeContract',
            'tron-WithdrawBalanceContract',
        ]);
    });

    it('omits Tron transactions that are not staking operations', () => {
        const state = getTronState([
            tronTx('TransferContract'),
            tronTx('TriggerSmartContract'),
            tronTx('DelegateResourceContract'),
        ]);

        expect(selectAccountStakeTypeTransactions(state, TRON_ACCOUNT_KEY)).toEqual([]);
    });
});
