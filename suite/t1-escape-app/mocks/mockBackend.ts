import { mock } from '@suite-common/dependency-injection';
import type {
    AccountInfo,
    Transaction as HistoryTransaction,
    TokenInfo,
    Utxo,
} from '@trezor/blockchain-link-types';
import { convertXpub } from '@trezor/connect-core/src/utils/hdnodeUtils';
import { err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';
import { Transaction, address as addressUtils } from '@trezor/utxo-lib';

import { mockAccountInfo, mockHistoryTransaction } from './mockAccountInfo';
import { mockPreviousTransaction } from './mockPreviousTransaction';
import type { MockWallet } from './mockWallet';
import type { Backend, EthereumBackend } from '../src/backend/backend';
import {
    ACCOUNT_TYPE_DEFINITIONS,
    type AccountType,
    getAccountPath,
} from '../src/bitcoin/accountType';
import { BITCOIN_NETWORK } from '../src/bitcoin/bitcoinNetwork';
import { getOutpointKey } from '../src/bitcoin/outpoint';
import type { DiscoveredAccount } from '../src/device/accountPublicKey';
import type { EthereumAccount } from '../src/ethereum/ethereumAccount';
import {
    ETHEREUM_CHAINS,
    type EthereumChain,
    getEthereumAddressPath,
} from '../src/ethereum/ethereumChain';
import { isPendingTransaction } from '../src/migration/accountState';

/** Gas prices the fake Ethereum blockbooks recommend, in wei per gas. */
export const MOCK_GAS_PRICES: Record<EthereumChain, string> = {
    ethereum: '20000000000',
    'ethereum-classic': '1000000000',
};

const getEthereumInfoKey = (chain: EthereumChain, address: string) =>
    `${chain}:${address.toLowerCase()}`;

const getInputTxid = (hash: Buffer) => bufferUtils.reverseBuffer(hash).toString('hex');

export type MockSeenTransactionParams = {
    /** Height of the block that mined the transaction. Left out, it sits in the mempool. */
    blockHeight?: number;
};

/**
 * An in-memory blockbook. The maps are exposed so that a test can change what the backend
 * answers, which is how a lying backend is simulated.
 */
export const mockBackend = () => {
    const accountInfos = new Map<string, AccountInfo>();
    const utxos = new Map<string, Utxo[]>();
    const transactionHexes = new Map<string, string>();

    /** Ethereum address infos by chain and lowercase address. */
    const ethereumAccountInfos = new Map<string, AccountInfo>();
    const gasPrices = { ...MOCK_GAS_PRICES };
    /** Ethereum transactions the backends know, by id. */
    const ethereumTransactions = new Map<string, HistoryTransaction>();

    const createEthereumBackend = (chain: EthereumChain) => ({
        getAccountInfo: mock<EthereumBackend['getAccountInfo']>(address =>
            Promise.resolve(
                ok(
                    ethereumAccountInfos.get(getEthereumInfoKey(chain, address)) ??
                        mockAccountInfo({ descriptor: address, misc: { nonce: '0' } }),
                ),
            ),
        ),
        estimateGasPrice: mock<EthereumBackend['estimateGasPrice']>(() =>
            Promise.resolve(ok(gasPrices[chain])),
        ),
        getTransaction: mock<EthereumBackend['getTransaction']>(txid => {
            const transaction = ethereumTransactions.get(txid);

            return Promise.resolve(
                transaction
                    ? ok(transaction)
                    : err({ type: 'backend', message: 'Transaction not found' }),
            );
        }),
    });

    const backend = {
        getAccountInfo: mock<Backend['getAccountInfo']>(({ descriptor }) =>
            Promise.resolve(ok(accountInfos.get(descriptor) ?? mockAccountInfo({ descriptor }))),
        ),
        getAccountUtxo: mock<Backend['getAccountUtxo']>(descriptor =>
            Promise.resolve(ok(utxos.get(descriptor) ?? [])),
        ),
        getTransactionHex: mock<Backend['getTransactionHex']>(txid => {
            const hex = transactionHexes.get(txid);

            return Promise.resolve(
                hex === undefined ? err({ type: 'backend', message: 'not found' }) : ok(hex),
            );
        }),
        ethereum: Object.fromEntries(
            ETHEREUM_CHAINS.map(chain => [chain, createEthereumBackend(chain)]),
        ) as Record<EthereumChain, ReturnType<typeof createEthereumBackend>>,
    };

    /**
     * Makes the Bitcoin blockbook show a signed transaction the way it does once somebody has
     * broadcast it: the outputs it spends leave the unspent list of their account and it enters
     * the account history, pending or mined. Seeing the same transaction again only updates it,
     * so a test can let it confirm.
     */
    const seeTransaction = (hex: string, { blockHeight = -1 }: MockSeenTransactionParams = {}) => {
        const transaction = Transaction.fromHex(hex, { network: BITCOIN_NETWORK });
        const txid = transaction.getId();
        const spentOutpoints = new Set(
            transaction.ins.map(input =>
                getOutpointKey({ txid: getInputTxid(input.hash), vout: input.index }),
            ),
        );
        const isSpent = (utxo: Utxo) => spentOutpoints.has(getOutpointKey(utxo));
        const historyTransaction = mockHistoryTransaction({
            txid,
            blockHeight,
            details: {
                vin: transaction.ins.map((input, n) => ({
                    txid: getInputTxid(input.hash),
                    // Blockbook leaves the index out when it is zero.
                    vout: input.index === 0 ? undefined : input.index,
                    n,
                    isAddress: true,
                    isAccountOwned: true,
                })),
                vout: transaction.outs.map((output, n) => ({
                    n,
                    isAddress: true,
                    addresses: [addressUtils.fromOutputScript(output.script, BITCOIN_NETWORK)],
                    value: output.value,
                })),
                size: hex.length / 2,
                totalInput: '0',
                totalOutput: '0',
            },
        });

        // The account is found by what the transaction spends, or by the transaction itself once
        // an earlier sighting already took the spent outputs away.
        const descriptors = new Set([
            ...[...utxos]
                .filter(([, owned]) => owned.some(isSpent))
                .map(([descriptor]) => descriptor),
            ...[...accountInfos]
                .filter(([, info]) => info.history.transactions?.some(known => known.txid === txid))
                .map(([descriptor]) => descriptor),
        ]);

        for (const descriptor of descriptors) {
            const remaining = (utxos.get(descriptor) ?? []).filter(utxo => !isSpent(utxo));
            utxos.set(descriptor, remaining);

            const info = accountInfos.get(descriptor) ?? mockAccountInfo({ descriptor });
            const otherTransactions = (info.history.transactions ?? []).filter(
                known => known.txid !== txid,
            );
            const transactions = [historyTransaction, ...otherTransactions];
            const sumRemaining = (address: string) =>
                remaining
                    .filter(utxo => utxo.address === address)
                    .reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n)
                    .toString();

            accountInfos.set(descriptor, {
                ...info,
                history: {
                    ...info.history,
                    total: info.history.total + (transactions.length - otherTransactions.length),
                    unconfirmed: transactions.filter(isPendingTransaction).length,
                    transactions,
                },
                ...(info.addresses
                    ? {
                          addresses: {
                              ...info.addresses,
                              used: info.addresses.used.map(used => ({
                                  ...used,
                                  balance: sumRemaining(used.address),
                              })),
                          },
                      }
                    : {}),
            });
        }
    };

    const setEthereumAccountInfo = (
        chain: EthereumChain,
        address: string,
        overrides: Partial<AccountInfo>,
    ) => {
        const key = getEthereumInfoKey(chain, address);
        const current = ethereumAccountInfos.get(key) ?? mockAccountInfo({ descriptor: address });
        ethereumAccountInfos.set(key, { ...current, ...overrides });
    };

    return {
        backend,
        accountInfos,
        utxos,
        transactionHexes,
        seeTransaction,
        ethereumAccountInfos,
        setEthereumAccountInfo,
        gasPrices,
        ethereumTransactions,
    };
};

export type MockBackend = ReturnType<typeof mockBackend>;

export type MockFundedAccountParams = {
    chain: MockBackend;
    wallet: MockWallet;
    accountType: AccountType;
    accountIndex?: number;
    /** One confirmed output per amount, on consecutive receive addresses. */
    amounts: string[];
};

/** Registers an account with confirmed outputs, backed by real previous transactions. */
export const mockFundedAccount = ({
    chain,
    wallet,
    accountType,
    accountIndex = 0,
    amounts,
}: MockFundedAccountParams) => {
    const xpub = wallet.getAccountXpub(accountType, accountIndex);
    const account: DiscoveredAccount = {
        accountType,
        accountIndex,
        path: getAccountPath(accountType, accountIndex),
        xpub,
        descriptor: convertXpub(
            xpub,
            BITCOIN_NETWORK,
            ACCOUNT_TYPE_DEFINITIONS[accountType].descriptorNetwork,
        ),
    };

    const accountUtxos = amounts.map((amount, addressIndex): Utxo => {
        const addressParams = { accountType, accountIndex, addressIndex };
        const previous = mockPreviousTransaction({
            outputs: [{ script: wallet.getScript(addressParams), value: amount }],
            nonce: addressIndex,
        });
        chain.transactionHexes.set(previous.txid, previous.hex);

        return {
            txid: previous.txid,
            vout: 0,
            amount,
            address: wallet.getAddress(addressParams),
            path: wallet.getAddressPath(addressParams),
            confirmations: 6,
            blockHeight: 800000,
        };
    });

    const balance = amounts.reduce((sum, amount) => sum + BigInt(amount), 0n).toString();
    chain.utxos.set(account.descriptor, accountUtxos);
    chain.accountInfos.set(
        account.descriptor,
        mockAccountInfo({
            descriptor: account.descriptor,
            empty: amounts.length === 0,
            balance,
            availableBalance: balance,
            history: { total: amounts.length, unconfirmed: 0, transactions: [] },
            addresses: {
                used: accountUtxos.map(({ address, path, amount }) => ({
                    address,
                    path,
                    transfers: 1,
                    balance: amount,
                    sent: '0',
                    received: amount,
                })),
                unused: [],
                change: [],
            },
        }),
    );

    return { account, utxos: accountUtxos };
};

export type MockFundedEthereumAddressParams = {
    chain: MockBackend;
    wallet: MockWallet;
    ethereumChain: EthereumChain;
    /** SLIP-44 coin type of the path family. Defaults to the chain's native one. */
    slip44?: number;
    index?: number;
    /** In wei. */
    balance: string;
    nonce?: string;
    transactions?: number;
    unconfirmedTransactions?: number;
    tokens?: TokenInfo[];
};

/** Registers an address of the wallet with a balance on one of the fake Ethereum blockbooks. */
export const mockFundedEthereumAddress = ({
    chain,
    wallet,
    ethereumChain,
    slip44 = ethereumChain === 'ethereum' ? 60 : 61,
    index = 0,
    balance,
    nonce = '0',
    transactions = 1,
    unconfirmedTransactions = 0,
    tokens,
}: MockFundedEthereumAddressParams) => {
    const path = getEthereumAddressPath(slip44, index);
    const address = wallet.getEthereumAddress(path);
    const account: EthereumAccount = { chain: ethereumChain, slip44, index, path, address };

    chain.setEthereumAccountInfo(
        ethereumChain,
        address,
        mockAccountInfo({
            descriptor: address,
            empty: false,
            balance,
            availableBalance: balance,
            history: {
                total: transactions,
                unconfirmed: unconfirmedTransactions,
                transactions: [],
            },
            misc: { nonce },
            ...(tokens ? { tokens } : {}),
        }),
    );

    return { account, address };
};
