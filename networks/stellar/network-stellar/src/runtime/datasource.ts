import {
    STELLAR_HISTORY_EFFECTS,
    STELLAR_LEDGER_HEAD_SOURCE,
    STELLAR_RPC_READ_FALLBACK,
    STELLAR_TRUSTLINE_DISCOVERY,
    type StellarHistoryEffects,
    type StellarLedgerHeadSource,
    type StellarRpcReadFallback,
    type StellarTrustlineDiscovery,
} from '../constants';
import type { StellarAPI, StellarTransaction } from '../types';
import {
    fetchAccountRecord,
    readAccountStateFromHorizon,
    readTrustlineAssets,
} from './horizon/account';
import { type ReadAccountHistoryParams, readAccountHistory } from './horizon/history';
import { readLatestLedgerFromHorizon } from './horizon/ledger';
import { readVersionFromHorizon } from './horizon/network';
import { readAccountState } from './rpc/account';
import { readInclusionFee } from './rpc/fees';
import { type StellarLedgerHead, readLatestLedger } from './rpc/ledger';
import { readVersion } from './rpc/network';
import { submitTransaction } from './rpc/submit';
import type { OperationGroup } from './transactions/group';
import type { StellarAccountState, StellarAssetRef } from '../types/account';

export interface StellarAccountStateRequest {
    descriptor: string;
    /** Classic assets Suite already knows about; used when trustlines are discovered over RPC. */
    knownAssets: StellarAssetRef[];
}

export interface StellarDataSource {
    readVersion: () => Promise<string>;
    readLatestLedger: () => Promise<StellarLedgerHead>;
    readInclusionFee: () => Promise<string>;
    readAccountState: (request: StellarAccountStateRequest) => Promise<StellarAccountState>;
    readAccountHistory: (
        request: Omit<ReadAccountHistoryParams, 'horizon'>,
    ) => Promise<OperationGroup[]>;
    submitTransaction: (transaction: StellarTransaction) => Promise<string>;
}

/**
 * Reads from the preferred source, standing in with the other one when the first fails to answer
 * at all.
 *
 * Only a thrown error triggers the stand-in. A read that answers "this account has no ledger
 * entry" is authoritative and returns normally, so a funded-account check is never second-guessed
 * against Horizon, which knows only what it has indexed. When the stand-in fails too the first
 * error is rethrown, since that is the one that explains the outage.
 */
const readWithFallback = async <T>(
    read: () => Promise<T>,
    readFromFallback: () => Promise<T>,
    isFallbackEnabled: boolean,
): Promise<T> => {
    try {
        return await read();
    } catch (error) {
        if (!isFallbackEnabled) {
            throw error;
        }

        try {
            return await readFromFallback();
        } catch {
            throw error;
        }
    }
};

/**
 * The one seam the blockchain-link worker talks to. Stellar RPC answers everything about
 * account state; Horizon is left with transaction history and, until the allow-list path is
 * measured, trustline discovery.
 */
export const createStellarDataSource = (
    api: StellarAPI,
    trustlineDiscovery: StellarTrustlineDiscovery = STELLAR_TRUSTLINE_DISCOVERY,
    fallback: StellarRpcReadFallback = STELLAR_RPC_READ_FALLBACK,
    headSource: StellarLedgerHeadSource = STELLAR_LEDGER_HEAD_SOURCE,
    historyEffects: StellarHistoryEffects = STELLAR_HISTORY_EFFECTS,
): StellarDataSource => ({
    readVersion: () =>
        readWithFallback(
            () => readVersion(api.rpc),
            () => readVersionFromHorizon(api.horizon),
            fallback === 'horizon',
        ),
    // The head is a block height and a base reserve, not authoritative account data, so either
    // source will do and the other always stands in — see `STELLAR_LEDGER_HEAD_SOURCE` for why
    // Horizon is asked first.
    readLatestLedger: () =>
        headSource === 'horizon'
            ? readWithFallback(
                  () => readLatestLedgerFromHorizon(api.horizon),
                  () => readLatestLedger(api.rpc),
                  true,
              )
            : readWithFallback(
                  () => readLatestLedger(api.rpc),
                  () => readLatestLedgerFromHorizon(api.horizon),
                  true,
              ),
    // Fee estimation only matters when sending, and sending is RPC-only, so there is nothing to
    // degrade to here.
    readInclusionFee: () => readInclusionFee(api.rpc),
    readAccountState: async ({ descriptor, knownAssets }) => {
        // A Horizon 404 only says Horizon has not seen the account; the missing account ledger
        // entry is what decides, so the RPC read runs either way. The record is kept because the
        // fallback needs it too, and refetching it would cost a second request.
        const record =
            trustlineDiscovery === 'rpc'
                ? undefined
                : await fetchAccountRecord(api.horizon, descriptor);
        // Horizon not knowing the account yields no assets rather than the caller's list: over
        // RPC the caller's list is all there is, but Horizon enumerating nothing is an answer.
        const discoveredAssets = record ? readTrustlineAssets(record) : [];
        const assets = trustlineDiscovery === 'rpc' ? knownAssets : discoveredAssets;

        return readWithFallback(
            () => readAccountState({ server: api.rpc, descriptor, assets }),
            async () => {
                const known = record ?? (await fetchAccountRecord(api.horizon, descriptor));

                // Horizon not having the account is not proof it is unfunded, so rather than
                // report an empty account the outage is surfaced as the error it is.
                if (!known) {
                    throw new Error('Horizon does not know this account');
                }

                return readAccountStateFromHorizon(known);
            },
            fallback === 'horizon',
        );
    },
    readAccountHistory: request =>
        readAccountHistory({ ...request, horizon: api.horizon }, historyEffects),
    submitTransaction: transaction => submitTransaction({ server: api.rpc, transaction }),
});
