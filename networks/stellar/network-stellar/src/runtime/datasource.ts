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
import type { StellarConnection, StellarTransaction } from '../types';
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

export type StellarAccountStateRequest = {
    descriptor: string;
    /** Classic assets Suite already knows about; used when trustlines are discovered over RPC. */
    knownAssets: StellarAssetRef[];
};

export type StellarDataSource = {
    readVersion: () => Promise<string>;
    readLatestLedger: () => Promise<StellarLedgerHead>;
    readInclusionFee: () => Promise<string>;
    readAccountState: (request: StellarAccountStateRequest) => Promise<StellarAccountState>;
    readAccountHistory: (
        request: Omit<ReadAccountHistoryParams, 'horizon'>,
    ) => Promise<OperationGroup[]>;
    submitTransaction: (transaction: StellarTransaction) => Promise<string>;
};

/** Falls back only when the first source throws; "no ledger entry" is an authoritative answer. */
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

/** The one interface the blockchain-link worker reads Stellar through. */
export const createStellarDataSource = (
    api: StellarConnection,
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
    readInclusionFee: () => readInclusionFee(api.rpc),
    readAccountState: async ({ descriptor, knownAssets }) => {
        // A Horizon 404 is not proof of absence; the ledger entry decides, so RPC is read anyway.
        const record =
            trustlineDiscovery === 'rpc'
                ? undefined
                : await fetchAccountRecord(api.horizon, descriptor);
        const discoveredAssets = record ? readTrustlineAssets(record) : [];
        const assets = trustlineDiscovery === 'rpc' ? knownAssets : discoveredAssets;

        return readWithFallback(
            () => readAccountState({ server: api.rpc, descriptor, assets }),
            async () => {
                const known = record ?? (await fetchAccountRecord(api.horizon, descriptor));

                // Horizon not knowing the account is no proof it is unfunded, so the outage surfaces.
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
