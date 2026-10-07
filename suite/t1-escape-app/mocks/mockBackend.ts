import { type Hex, keccak256 } from 'viem';

import { mock } from '@suite-common/dependency-injection';
import type {
    AccountInfo,
    Transaction as HistoryTransaction,
    TokenInfo,
    Utxo,
} from '@trezor/blockchain-link-types';
import { convertXpub } from '@trezor/connect-core/src/utils/hdnodeUtils';
import { err, ok } from '@trezor/type-utils';
import { Transaction } from '@trezor/utxo-lib';

import { mockAccountInfo } from './mockAccountInfo';
import { mockPreviousTransaction } from './mockPreviousTransaction';
import type { MockWallet } from './mockWallet';
import type { Backend, EthereumBackend } from '../src/backend/backend';
import {
    ACCOUNT_TYPE_DEFINITIONS,
    type AccountType,
    getAccountPath,
} from '../src/bitcoin/accountType';
import { BITCOIN_NETWORK } from '../src/bitcoin/bitcoinNetwork';
import type { DiscoveredAccount } from '../src/device/accountPublicKey';
import type { EthereumAccount } from '../src/ethereum/ethereumAccount';
import {
    ETHEREUM_CHAINS,
    type EthereumChain,
    getEthereumAddressPath,
} from '../src/ethereum/ethereumChain';

/** Gas prices the fake Ethereum blockbooks recommend, in wei per gas. */
export const MOCK_GAS_PRICES: Record<EthereumChain, string> = {
    ethereum: '20000000000',
    'ethereum-classic': '1000000000',
};

const getEthereumInfoKey = (chain: EthereumChain, address: string) =>
    `${chain}:${address.toLowerCase()}`;

/**
 * An in-memory blockbook. The maps are exposed so that a test can change what the backend
 * answers, which is how a lying backend is simulated.
 */
export const mockBackend = () => {
    const accountInfos = new Map<string, AccountInfo>();
    const utxos = new Map<string, Utxo[]>();
    const transactionHexes = new Map<string, string>();
    const pushedTransactions: string[] = [];

    /** Ethereum address infos by chain and lowercase address. */
    const ethereumAccountInfos = new Map<string, AccountInfo>();
    const gasPrices = { ...MOCK_GAS_PRICES };
    /** Ethereum transactions the backends know, by id. */
    const ethereumTransactions = new Map<string, HistoryTransaction>();
    const pushedEthereumTransactions: Hex[] = [];

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
        pushTransaction: mock<EthereumBackend['pushTransaction']>(hex => {
            pushedEthereumTransactions.push(hex as Hex);

            return Promise.resolve(ok(keccak256(hex as Hex)));
        }),
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
        pushTransaction: mock<Backend['pushTransaction']>(hex => {
            pushedTransactions.push(hex);

            return Promise.resolve(
                ok(Transaction.fromHex(hex, { network: BITCOIN_NETWORK }).getId()),
            );
        }),
        ethereum: Object.fromEntries(
            ETHEREUM_CHAINS.map(chain => [chain, createEthereumBackend(chain)]),
        ) as Record<EthereumChain, ReturnType<typeof createEthereumBackend>>,
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
        pushedTransactions,
        ethereumAccountInfos,
        setEthereumAccountInfo,
        gasPrices,
        ethereumTransactions,
        pushedEthereumTransactions,
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
