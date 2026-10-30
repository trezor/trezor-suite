import type { NetworkType } from '@suite-common/wallet-config';

import type { SqlValue } from '../sqlite/transactionStoreSqlite';
import type { SuspiciousTransactionsContext } from '../transactionStoreTypes';

type Clause = { sql: string; parameters: SqlValue[] };

type Detector = 'zero' | 'fakeToken' | 'unknown' | 'trc10' | 'unsolicitedAssetOffer';

/**
 * The app's `PHISHING_VALIDATORS` in `@suite-common/token-definitions`, less the dust detector,
 * mirrored in SQL so hiding suspicious transactions filters, pages and counts in the database over
 * the whole stored history. Dust needs fiat rates, which only the app has and only for the
 * transactions it loaded; it hands those over as `flaggedTxids`. Networks not listed have nothing
 * suspicious. Keep the two in step.
 */
const DETECTORS_BY_NETWORK_TYPE: Partial<Record<NetworkType, Detector[]>> = {
    bitcoin: ['zero'],
    ethereum: ['fakeToken', 'zero'],
    cardano: ['fakeToken'],
    solana: ['fakeToken'],
    stellar: ['unsolicitedAssetOffer', 'unknown', 'fakeToken'],
    tron: ['trc10', 'fakeToken'],
};

/** The app's `NFT_TOKEN_STANDARDS`; definitions list NFTs apart from coins. */
const NFT_STANDARDS = ['ERC721', 'TRC721', 'BEP721', 'ERC1155', 'TRC1155', 'BEP1155'];

const toPlaceholders = (values: ReadonlyArray<unknown>) => values.map(() => '?').join(', ');

// The app's `PHISHING_WHITELISTED_TX_TYPES`: never suspicious, whatever they move.
const IS_WHITELISTED = "t.type IN ('sent', 'self', 'joint', 'failed')";
const SYMBOL = '(SELECT symbol FROM accounts WHERE account_key = t.account_key)';

/** Whether any of the transaction's transfers, aliased `f`, meets the condition. */
const someTransfer = (condition: string) =>
    `EXISTS (SELECT 1 FROM transfers f
        WHERE f.account_key = t.account_key AND f.txid = t.txid AND (${condition}))`;
const noTransfer = (condition: string) => `NOT ${someTransfer(condition)}`;

const IS_TOKEN = "f.kind = 'token'";
const IS_ZERO = 'CAST(f.amount AS REAL) = 0';
// A token-only transaction has no native transfer row.
const MOVES_NO_COIN = noTransfer("f.kind = 'native'");
const HAS_TOKENS = someTransfer(IS_TOKEN);
const HAS_DEFINITIONS = `EXISTS (SELECT 1 FROM token_definition_networks d WHERE d.symbol = ${SYMBOL})`;
const TOKEN_KIND = `CASE WHEN f.standard IN (${NFT_STANDARDS.map(standard => `'${standard}'`).join(', ')})
    THEN 'nft' ELSE 'coin' END`;

/** The contract as the definitions list it: the app's `getContractAddressForNetworkSymbol`. */
const toContractKey = (networkType: NetworkType) => {
    switch (networkType) {
        case 'ethereum':
            return 'lower(f.contract)';
        // The policy id: the asset's first 28 bytes.
        case 'cardano':
            return 'lower(substr(f.contract, 1, 56))';
        default:
            return 'f.contract';
    }
};

/** A token the definitions know, moving an amount: the app's "legit" token. */
const isLegit = (networkType: NetworkType) =>
    `${IS_TOKEN} AND NOT ${IS_ZERO} AND EXISTS (SELECT 1 FROM known_tokens k
        WHERE k.symbol = ${SYMBOL} AND k.kind = ${TOKEN_KIND}
        AND k.contract = ${toContractKey(networkType)})`;

const toDetectorSql = (detector: Detector, networkType: NetworkType) => {
    switch (detector) {
        case 'zero':
            return `(NOT ${IS_WHITELISTED} AND ${MOVES_NO_COIN} AND ${HAS_TOKENS}
                AND ${noTransfer(`${IS_TOKEN} AND NOT ${IS_ZERO}`)})`;
        case 'unknown':
            return "t.type = 'unknown'";
        // `IS`, not `=`: a missing field must read as false, as `NULL` would hide the whole row.
        case 'trc10':
            return "json_extract(t.data, '$.tronSpecific.contractType') IS 'TransferAssetContract'";
        case 'unsolicitedAssetOffer':
            return "json_extract(t.data, '$.stellarSpecific.claimableBalanceOffer.isClaimant') IS 1";
        case 'fakeToken':
            // Only once the app fed the network's definitions; before, no token is "fake".
            return `(${HAS_DEFINITIONS} AND ${MOVES_NO_COIN} AND ${HAS_TOKENS}
                AND ${noTransfer(isLegit(networkType))})`;
    }
};

/**
 * The condition keeping only transactions that are not suspicious, on transactions aliased `t`,
 * evaluated in SQLite. The accounts come grouped by network type, as each has its own detectors.
 */
export const toSuspiciousClause = (
    { notScamTxids, flaggedTxids }: SuspiciousTransactionsContext,
    accountKeysByNetworkType: ReadonlyMap<NetworkType, string[]>,
): Clause => {
    const groups = [...accountKeysByNetworkType].flatMap(([networkType, accountKeys]): Clause[] => {
        const detectors = DETECTORS_BY_NETWORK_TYPE[networkType] ?? [];
        if (detectors.length === 0) return [];

        const detected = detectors
            .map(detector => toDetectorSql(detector, networkType))
            .join(' OR ');

        return [
            {
                sql: `(t.account_key IN (${toPlaceholders(accountKeys)}) AND (${detected}))`,
                parameters: accountKeys,
            },
        ];
    });
    if (flaggedTxids.length > 0) {
        groups.push({
            sql: `t.txid IN (${toPlaceholders(flaggedTxids)})`,
            parameters: flaggedTxids,
        });
    }
    const isSuspicious = groups.length === 0 ? '0' : groups.map(group => group.sql).join(' OR ');
    const isNotMarked =
        notScamTxids.length === 0 ? '' : `t.txid NOT IN (${toPlaceholders(notScamTxids)}) AND `;

    return {
        sql: `NOT (${isNotMarked}(${isSuspicious}))`,
        parameters: [...notScamTxids, ...groups.flatMap(group => group.parameters)],
    };
};
