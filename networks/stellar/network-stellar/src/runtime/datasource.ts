import { STELLAR_TRUSTLINE_DISCOVERY, type StellarTrustlineDiscovery } from '../constants';
import type { StellarAPI, StellarTransaction } from '../types';
import { discoverTrustlineAssets } from './horizon/account';
import { type ReadAccountHistoryParams, readAccountHistory } from './horizon/history';
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
 * The one seam the blockchain-link worker talks to. Stellar RPC answers everything about
 * account state; Horizon is left with transaction history and, until the allow-list path is
 * measured, trustline discovery.
 */
export const createStellarDataSource = (
    api: StellarAPI,
    trustlineDiscovery: StellarTrustlineDiscovery = STELLAR_TRUSTLINE_DISCOVERY,
): StellarDataSource => ({
    readVersion: () => readVersion(api.rpc),
    readLatestLedger: () => readLatestLedger(api.rpc),
    readInclusionFee: () => readInclusionFee(api.rpc),
    readAccountState: async ({ descriptor, knownAssets }) => {
        // A Horizon 404 only says Horizon has not seen the account; the missing account ledger
        // entry is what decides, so the RPC read runs either way.
        const assets =
            trustlineDiscovery === 'rpc'
                ? knownAssets
                : ((await discoverTrustlineAssets(api.horizon, descriptor)) ?? []);

        return readAccountState({ server: api.rpc, descriptor, assets });
    },
    readAccountHistory: request => readAccountHistory({ ...request, horizon: api.horizon }),
    submitTransaction: transaction => submitTransaction({ server: api.rpc, transaction }),
});
