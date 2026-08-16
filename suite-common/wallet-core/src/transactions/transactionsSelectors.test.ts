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
    selectHasPendingTransactionBlockingClaim,
    selectTransactionsWithMissingRates,
} from './transactionsSelectors';
import { type AccountsRootState } from '../accounts/accountsReducer';
import { type FiatRatesRootState } from '../fiat-rates/fiatRatesTypes';

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

const ADA_ACCOUNT_KEY = 'descriptor-ada-device' as AccountKey;

const adaAccount = (rewards: string) =>
    ({
        key: ADA_ACCOUNT_KEY,
        symbol: 'ada',
        networkType: 'cardano',
        misc: { staking: { isActive: true, rewards } },
    }) as unknown as Account;

const cardanoStakingTx = (subtype: string, blockHeight: number): WalletAccountTransaction =>
    ({
        txid: `ada-${subtype}`,
        symbol: 'ada',
        blockHeight,
        tokens: [],
        cardanoSpecific: { subtype },
    }) as unknown as WalletAccountTransaction;

const withdrawalTx = (blockHeight: number) => cardanoStakingTx('withdrawal', blockHeight);

// Everstake pool method ids, kept private by ethereumStakingUtils.
const STAKE_METHOD_ID = '0x3a29dbae';
const CLAIM_METHOD_ID = '0x33986ffa';

const getClaimState = (
    account: Account,
    transactions: WalletAccountTransaction[] = [],
): TransactionsRootState & AccountsRootState =>
    ({
        wallet: {
            transactions: { transactions: { [account.key]: transactions } },
            accounts: [account],
        },
    }) as unknown as TransactionsRootState & AccountsRootState;

describe('selectHasPendingTransactionBlockingClaim', () => {
    it.each(['withdrawal', 'stake_delegation'])(
        'blocks an ADA claim while a %s tx is confirming, because they compete for the same UTXOs',
        subtype => {
            const state = getClaimState(adaAccount('15000000'), [cardanoStakingTx(subtype, -1)]);
            expect(selectHasPendingTransactionBlockingClaim(state, ADA_ACCOUNT_KEY)).toBe(true);
        },
    );

    it('stops blocking an ADA claim once the withdrawal is confirmed', () => {
        const state = getClaimState(adaAccount('15000000'), [withdrawalTx(1234)]);
        expect(selectHasPendingTransactionBlockingClaim(state, ADA_ACCOUNT_KEY)).toBe(false);
    });

    it('blocks an ETH claim only while a claim tx of its own is confirming', () => {
        const ethStakingAccount = {
            key: ACCOUNT_KEY,
            symbol: 'eth',
            networkType: 'ethereum',
            misc: {},
        } as unknown as Account;

        const ethTx = (methodId: string, blockHeight: number) =>
            ({
                txid: `eth-${methodId}`,
                symbol: 'eth',
                blockHeight,
                tokens: [],
                ethereumSpecific: { parsedData: { methodId } },
            }) as unknown as WalletAccountTransaction;

        const pendingClaim = getClaimState(ethStakingAccount, [ethTx(CLAIM_METHOD_ID, -1)]);
        expect(selectHasPendingTransactionBlockingClaim(pendingClaim, ACCOUNT_KEY)).toBe(true);

        const pendingStake = getClaimState(ethStakingAccount, [ethTx(STAKE_METHOD_ID, -1)]);
        expect(selectHasPendingTransactionBlockingClaim(pendingStake, ACCOUNT_KEY)).toBe(false);
    });
});
