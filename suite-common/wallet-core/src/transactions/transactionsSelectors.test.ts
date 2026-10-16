import { type DeviceRootState } from '@suite-common/device';
import {
    type NotificationsRootState,
    type TransactionNotification,
} from '@suite-common/toast-notifications';
import {
    DUST_PHISHING_THRESHOLD,
    type TokenDefinitionsRootState,
} from '@suite-common/token-definitions';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    type TokenAddress,
    type WalletAccountTransaction,
    asAccountDescriptor,
} from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { enhanceTransaction } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type AccountTransaction } from '@trezor/connect';

import { type TransactionsRootState } from './transactionsReducerTypes';
import {
    selectEvmPrivatePendingHint,
    selectHasUnseenNonPhishingTransactionNotifications,
    selectNonPhishingTransactionNotifications,
    selectTransactionSenderAccount,
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

describe('selectTransactionSenderAccount', () => {
    // Public test vectors of BIP173 and of the addresses of utxo-lib.
    const SENDER_ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
    const RECEIVER_ADDRESS = '3LRW7jeCvQCRdPF8S3yUCfRAx4eqXFmdcr';
    const FOREIGN_ADDRESS = '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH';

    const getBitcoinAccount = (descriptor: string, address: string) =>
        mockWalletAccount({
            symbol: asNetworkSymbol('btc'),
            descriptor: asAccountDescriptor(descriptor),
            addresses: {
                change: [],
                used: [{ address, path: '', transfers: 1, balance: '0', sent: '0', received: '0' }],
                unused: [],
            },
        });

    const senderAccount = getBitcoinAccount('zpubSender', SENDER_ADDRESS);
    const receiverAccount = getBitcoinAccount('zpubReceiver', RECEIVER_ADDRESS);

    type TransactionInput = AccountTransaction['details']['vin'][number];

    const getTransfer = (
        type: AccountTransaction['type'],
        input: TransactionInput,
    ): AccountTransaction => ({
        type,
        txid: 'cc'.repeat(32),
        blockHeight: 100,
        amount: '9000',
        fee: '1000',
        targets: [],
        tokens: [],
        internalTransfers: [],
        details: {
            vin: [input],
            vout: [{ n: 0, addresses: [RECEIVER_ADDRESS], isAddress: true, value: '9000' }],
            size: 200,
            totalInput: input.value ?? '0',
            totalOutput: '9000',
        },
    });

    const parentOutput = { txid: 'aa'.repeat(32), vout: 0, n: 0 };
    const senderInput: TransactionInput = {
        ...parentOutput,
        addresses: [SENDER_ADDRESS],
        isAddress: true,
        value: '10000',
    };
    // The Electrum backend gives the receiving account the input of the sender without its value.
    const unresolvedInput: TransactionInput = { ...parentOutput, addresses: [], isAddress: false };

    const sent = enhanceTransaction(getTransfer('sent', senderInput), senderAccount);
    const unresolvedReceived = enhanceTransaction(
        getTransfer('recv', unresolvedInput),
        receiverAccount,
    );

    const getSenderState = (
        transactions: Record<AccountKey, WalletAccountTransaction[]>,
    ): TransactionsRootState & AccountsRootState => ({
        wallet: {
            accounts: [senderAccount, receiverAccount],
            transactions: { transactions, phishing: {}, fetchStatusDetail: {} },
        },
    });

    it('finds the sender of a transaction by the addresses of its inputs', () => {
        const received = enhanceTransaction(getTransfer('recv', senderInput), receiverAccount);
        const state = getSenderState({ [receiverAccount.key]: [received] });

        expect(selectTransactionSenderAccount(state, received)).toBe(senderAccount);
    });

    it('finds the sender of a transaction with unresolved inputs by its copy in the sender account', () => {
        const state = getSenderState({
            [senderAccount.key]: [sent],
            [receiverAccount.key]: [unresolvedReceived],
        });

        expect(selectTransactionSenderAccount(state, unresolvedReceived)).toBe(senderAccount);
    });

    it('finds no sender of a transaction with unresolved inputs from outside the wallet', () => {
        const state = getSenderState({ [receiverAccount.key]: [unresolvedReceived] });
        const foreignSent = enhanceTransaction(
            getTransfer('sent', { ...senderInput, addresses: [FOREIGN_ADDRESS] }),
            senderAccount,
        );

        expect(selectTransactionSenderAccount(state, unresolvedReceived)).toBeUndefined();
        expect(
            selectTransactionSenderAccount(
                getSenderState({
                    [senderAccount.key]: [foreignSent],
                    [receiverAccount.key]: [unresolvedReceived],
                }),
                unresolvedReceived,
            ),
        ).toBeUndefined();
    });
});
