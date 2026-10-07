import { type Result, ok } from '@trezor/type-utils';

import {
    type EthereumDiscoveryError,
    type EthereumScannedAddress,
    type ScanEthereumPathFamiliesParams,
    isEthereumWalletEmpty,
    scanEthereumPathFamilies,
} from './discoverEthereumAddresses';
import { discoverWalletCandidates } from './discoverWalletCandidates';
import type { WalletKind } from './scanReport';
import type { PassphraseCandidates } from '../device/passphrase';

export type DiscoveredEthereumWallet = {
    walletKind: WalletKind;
    addresses: EthereumScannedAddress[];
};

export type DiscoverEthereumWalletParams = ScanEthereumPathFamiliesParams & {
    /** Present when the device has passphrase protection turned on. */
    passphraseCandidates?: PassphraseCandidates;
    /** Chooses the passphrase the session answers with when the device asks for one. */
    setActivePassphrase: (passphrase: string) => void;
};

/**
 * Runs the standard discovery of one chain in the wallet the device currently unlocks, trying
 * the passphrase candidates the way `discoverWalletCandidates` describes.
 */
export const discoverEthereumWallet = async ({
    passphraseCandidates,
    setActivePassphrase,
    ...params
}: DiscoverEthereumWalletParams): Promise<
    Result<DiscoveredEthereumWallet, EthereumDiscoveryError>
> => {
    const discovered = await discoverWalletCandidates({
        call: params.call,
        passphraseCandidates,
        setActivePassphrase,
        scan: () => scanEthereumPathFamilies(params),
        isWalletEmpty: isEthereumWalletEmpty,
    });
    if (!discovered.success) return discovered;

    const { walletKind, scanned } = discovered.payload;

    return ok({ walletKind, addresses: scanned });
};
