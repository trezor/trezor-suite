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
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { transactionsInitialState } from './transactionsReducer';
import { type TransactionsRootState } from './transactionsReducerTypes';
import {
    selectAccountStakeTypeTransactions,
    selectAccountYieldVaultTransactions,
    selectEvmPrivatePendingHint,
    selectHasUnseenNonPhishingTransactionNotifications,
    selectNonPhishingTransactionNotifications,
    selectTransactionsWithMissingRates,
} from './transactionsSelectors';
import { type AccountsRootState, accountsInitialState } from '../accounts/accountsReducer';
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
        amount: '0.0000005',
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

describe('selectAccountYieldVaultTransactions', () => {
    const OTHER_VAULT_CONTRACT = '0x8eb67a509616cd6a7c1b3c8c21d48ff57df3d458' as TokenAddress;
    const RECEIVER = '0000000000000000000000009ea3721b5bf3b64b4418c38b603154d2d597fae3';
    const AMOUNT = '00000000000000000000000000000000000000000000000000000000004c4b40';
    const ERC4626_DEPOSIT = `0x6e553f65${AMOUNT}${RECEIVER}`;
    const TRANSFER = `0xa9059cbb${RECEIVER}${AMOUNT}`;

    type VaultCallTransactionParams = {
        txid: string;
        callTarget: string;
        data: string;
    };

    const vaultCallTransaction = ({ txid, callTarget, data }: VaultCallTransactionParams) =>
        testMocks.getWalletTransaction({
            txid,
            symbol: asNetworkSymbol('eth'),
            ethereumSpecific: { status: 1, nonce: 0, gasLimit: 200000, data },
            details: {
                vin: [],
                vout: [{ n: 0, isAddress: true, addresses: [callTarget] }],
                size: 0,
                totalInput: '0',
                totalOutput: '0',
            },
        });

    const getVaultState = (transactions: WalletAccountTransaction[]): TransactionsRootState => ({
        wallet: {
            transactions: {
                ...transactionsInitialState,
                transactions: { [ACCOUNT_KEY]: transactions },
            },
            accounts: accountsInitialState,
        },
    });

    it('keeps only the deposit/withdraw/redeem transactions of the given vault', () => {
        const state = getVaultState([
            vaultCallTransaction({
                txid: 'vault-deposit',
                callTarget: VAULT_CONTRACT,
                data: ERC4626_DEPOSIT,
            }),
            vaultCallTransaction({
                txid: 'other-vault-deposit',
                callTarget: OTHER_VAULT_CONTRACT,
                data: ERC4626_DEPOSIT,
            }),
            vaultCallTransaction({
                txid: 'unrelated-transfer',
                callTarget: USDT_CONTRACT,
                data: TRANSFER,
            }),
        ]);

        expect(
            selectAccountYieldVaultTransactions(state, ACCOUNT_KEY, VAULT_CONTRACT).map(
                tx => tx.txid,
            ),
        ).toEqual(['vault-deposit']);
        expect(
            selectAccountYieldVaultTransactions(state, ACCOUNT_KEY, OTHER_VAULT_CONTRACT).map(
                tx => tx.txid,
            ),
        ).toEqual(['other-vault-deposit']);
    });
});
