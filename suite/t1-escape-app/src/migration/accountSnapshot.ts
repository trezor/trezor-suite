import type { AccountInfo, Address, Utxo } from '@trezor/blockchain-link-types';
import { type Result, ok } from '@trezor/type-utils';

import type { Backend, BackendError } from '../backend/backend';
import type { DiscoveredAccount } from '../device/accountPublicKey';

/** Address gap of the deep scan. Old wallets sometimes skipped more than the standard 20. */
export const DEEP_SCAN_ADDRESS_GAP = 100;

/** Transactions requested per account. Pending ones come first, so they all fit on the page. */
export const HISTORY_PAGE_SIZE = 100;

/** What the backend says about one account at one moment. Untrusted until verified. */
export type AccountSnapshot = {
    info: AccountInfo;
    utxos: Utxo[];
};

export const getAccountAddresses = (info: AccountInfo): Address[] =>
    info.addresses
        ? [...info.addresses.used, ...info.addresses.unused, ...info.addresses.change]
        : [];

// Blockbook leaves `balance` out for an address that was never used, although the shared type
// declares it as always present.
const isFunded = (balance: string | undefined) => balance !== undefined && balance !== '0';

export type LoadAccountSnapshotParams = {
    backend: Backend;
    account: DiscoveredAccount;
};

/**
 * Loads the account history with the deep address gap and its unspent outputs.
 *
 * The backend lists UTXOs of an extended public key only within the standard gap. Addresses the
 * deep scan found funded beyond it are therefore queried one by one, and the derivation path the
 * address-level answer lacks is filled in from the account's address list. A wrong path cannot
 * cause harm: every input script is re-derived and compared before signing.
 */
export const loadAccountSnapshot = async ({
    backend,
    account,
}: LoadAccountSnapshotParams): Promise<Result<AccountSnapshot, BackendError>> => {
    const info = await backend.getAccountInfo({
        descriptor: account.descriptor,
        details: 'txs',
        tokens: 'derived',
        gap: DEEP_SCAN_ADDRESS_GAP,
        pageSize: HISTORY_PAGE_SIZE,
    });
    if (!info.success) return info;

    const accountUtxos = await backend.getAccountUtxo(account.descriptor);
    if (!accountUtxos.success) return accountUtxos;

    const coveredAddresses = new Set(accountUtxos.payload.map(utxo => utxo.address));
    const uncoveredFundedAddresses = getAccountAddresses(info.payload).filter(
        ({ address, balance }) => isFunded(balance) && !coveredAddresses.has(address),
    );

    const utxos = [...accountUtxos.payload];
    for (const { address, path } of uncoveredFundedAddresses) {
        const addressUtxos = await backend.getAccountUtxo(address);
        if (!addressUtxos.success) return addressUtxos;

        utxos.push(...addressUtxos.payload.map(utxo => ({ ...utxo, address, path })));
    }

    return ok({ info: info.payload, utxos });
};
