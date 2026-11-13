import { type BitcoinFamilyDeps, bitcoinFamily } from '@trezor/network-bitcoin-suite-common';
import { type CardanoFamilyDeps, cardanoFamily } from '@trezor/network-cardano-suite-common';
import { type EthereumFamilyDeps, ethereumFamily } from '@trezor/network-ethereum-suite-common';
import type { BoundNetworkFamily } from '@trezor/network-module-suite-common-types';
import { rippleFamily } from '@trezor/network-ripple-suite-common';
import { solanaFamily } from '@trezor/network-solana-suite-common';
import { stellarFamily } from '@trezor/network-stellar-suite-common';
import { tronFamily } from '@trezor/network-tron-suite-common';

const networkFamilies = [
    bitcoinFamily,
    ethereumFamily,
    rippleFamily,
    cardanoFamily,
    solanaFamily,
    stellarFamily,
    tronFamily,
] as const;

/** The id of every family the apps serve, for anything an app keys by family, such as overrides. */
export type NetworkFamilyId = (typeof networkFamilies)[number]['family'];

type NetworkFamiliesCompositionRootDeps = BitcoinFamilyDeps &
    CardanoFamilyDeps &
    EthereumFamilyDeps;

/** The only place that names concrete families; everything else resolves networks through them. */
export const createNetworkFamiliesCompositionRoot = (
    deps: NetworkFamiliesCompositionRootDeps,
): readonly BoundNetworkFamily[] => networkFamilies.map(family => family.bind(deps));
