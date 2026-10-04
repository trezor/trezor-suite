import { mock } from '@suite-common/dependency-injection';
import type { AccountInfo, Utxo } from '@trezor/blockchain-link-types';
import { convertXpub } from '@trezor/connect-core/src/utils/hdnodeUtils';
import { err, ok } from '@trezor/type-utils';
import { Transaction } from '@trezor/utxo-lib';

import { mockAccountInfo } from './mockAccountInfo';
import { mockPreviousTransaction } from './mockPreviousTransaction';
import type { MockWallet } from './mockWallet';
import type { Backend } from '../src/backend/backend';
import {
    ACCOUNT_TYPE_DEFINITIONS,
    type AccountType,
    getAccountPath,
} from '../src/bitcoin/accountType';
import { BITCOIN_NETWORK } from '../src/bitcoin/bitcoinNetwork';
import type { DiscoveredAccount } from '../src/device/accountPublicKey';

/**
 * An in-memory blockbook. The maps are exposed so that a test can change what the backend
 * answers, which is how a lying backend is simulated.
 */
export const mockBackend = () => {
    const accountInfos = new Map<string, AccountInfo>();
    const utxos = new Map<string, Utxo[]>();
    const transactionHexes = new Map<string, string>();
    const pushedTransactions: string[] = [];

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
    };

    return { backend, accountInfos, utxos, transactionHexes, pushedTransactions };
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
