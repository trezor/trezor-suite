import { type Account, type DiscoveryStatus } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { type DiscoveryStatusType } from 'src/types/wallet';

export type HomeAssetEmptyStateKind =
    | 'noNetworkEnabled'
    | 'discoveryFailed'
    | 'deviceUnavailable'
    | 'passphraseCancelled'
    | 'loading'
    | 'emptyWallet';

type DiscoveryExceptionType = Extract<DiscoveryStatusType, { status: 'exception' }>['type'];

const getExceptionKind = (type: DiscoveryExceptionType): HomeAssetEmptyStateKind => {
    switch (type) {
        case 'discovery-empty':
            return 'noNetworkEnabled';
        case 'discovery-failed':
            return 'discoveryFailed';
        case 'device-unavailable':
            return 'deviceUnavailable';
        default:
            return exhaustive(type);
    }
};

type GetHomeAssetEmptyStateKindParams = {
    accounts: readonly Account[];
    discoveryStatus: DiscoveryStatusType | undefined;
    discoveryProgressStatus: DiscoveryStatus['status'] | undefined;
};

/**
 * What the asset-first Home shows instead of its table, decided as the dashboard it replaces decides
 * it. Only a wallet with no network turned on, or one holding nothing, gets one: a wallet with assets
 * always sees its table, even while discovery is still running or part of it failed.
 */
export const getHomeAssetEmptyStateKind = ({
    accounts,
    discoveryStatus,
    discoveryProgressStatus,
}: GetHomeAssetEmptyStateKindParams): HomeAssetEmptyStateKind | undefined => {
    const hasHoldings = accounts.some(account => !account.empty && !isAccountFailed(account));

    if (hasHoldings) {
        return undefined;
    }

    if (discoveryStatus?.status === 'exception') {
        return getExceptionKind(discoveryStatus.type);
    }

    if (
        accounts.length === 0 &&
        discoveryStatus === undefined &&
        discoveryProgressStatus === 'cancelled'
    ) {
        return 'passphraseCancelled';
    }

    if (!accounts.every(account => account.empty)) {
        return undefined;
    }

    return discoveryStatus?.status === 'loading' ? 'loading' : 'emptyWallet';
};
