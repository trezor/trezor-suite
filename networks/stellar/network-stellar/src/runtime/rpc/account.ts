import { decodeAccountEntry, decodeTrustlineEntry } from './decode';
import { buildAccountKey, buildTrustlineKey } from './ledgerKeys';
import { STELLAR_RPC_MAX_LEDGER_KEYS } from '../../constants';
import type { StellarAccountState, StellarAssetRef, StellarTrustline } from '../../types/account';
import type { StellarRpcServer } from '../../types/rpc';

const EMPTY_ACCOUNT_STATE: StellarAccountState = {
    exists: false,
    balance: '0',
    sequence: '0',
    numSubEntries: 0,
    numSponsoring: 0,
    numSponsored: 0,
    sellingLiabilities: '0',
    trustlines: [],
};

const toChunks = <T>(items: T[], size: number): T[][] =>
    items.reduce<T[][]>((chunks, item, index) => {
        if (index % size === 0) {
            return [...chunks, [item]];
        }
        chunks[chunks.length - 1]?.push(item);

        return chunks;
    }, []);

export interface ReadAccountStateParams {
    server: StellarRpcServer;
    descriptor: string;
    /** Assets to look up. A trustline to anything outside this list stays invisible. */
    assets: StellarAssetRef[];
}

/**
 * Reads an account's native balance, sequence, reserve inputs and trustline balances in one
 * batched `getLedgerEntries`. Amounts come back as stroops, so no decimal conversion is needed.
 *
 * Entries that do not exist are omitted from the response rather than reported as empty, which
 * is exactly the "does this trustline exist" signal — and, for the account key itself, the
 * "account not funded yet" signal.
 */
export const readAccountState = async ({
    server,
    descriptor,
    assets,
}: ReadAccountStateParams): Promise<StellarAccountState> => {
    const keys = [
        buildAccountKey(descriptor),
        ...assets.map(({ assetCode, assetIssuer }) =>
            buildTrustlineKey(descriptor, assetCode, assetIssuer),
        ),
    ];

    const responses = await Promise.all(
        toChunks(keys, STELLAR_RPC_MAX_LEDGER_KEYS).map(chunk => server.getLedgerEntries(...chunk)),
    );
    const entries = responses.flatMap(response => response.entries);

    const account = entries.reduce<ReturnType<typeof decodeAccountEntry>>(
        (found, entry) => found ?? decodeAccountEntry(entry.val),
        undefined,
    );

    if (!account) {
        return EMPTY_ACCOUNT_STATE;
    }

    const trustlines = entries.reduce<StellarTrustline[]>((found, entry) => {
        const trustline = decodeTrustlineEntry(entry.val);

        return trustline ? [...found, trustline] : found;
    }, []);

    return { exists: true, ...account, trustlines };
};
