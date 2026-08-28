import { type TransactionSimulation } from '../types';

export type CrossChainAssetDiff = NonNullable<
    TransactionSimulation['cross_chain_asset_diffs']
>[number]['obj'][number];

type CrossChainAssetDiffsByAddress = Record<string, CrossChainAssetDiff[]>;

export const getCrossChainAssetDiffs = (
    simulation: TransactionSimulation,
    accountAddress: string | undefined,
): CrossChainAssetDiff[] => {
    // The SDK types an array here; the API actually returns an address-keyed map.
    const diffs: unknown = simulation.cross_chain_asset_diffs;

    if (!diffs || !accountAddress) {
        return [];
    }

    const byAddress: CrossChainAssetDiffsByAddress = Array.isArray(diffs)
        ? Object.fromEntries(
              (diffs as ReadonlyArray<{ address: string; obj: CrossChainAssetDiff[] }>).map(
                  ({ address, obj }) => [address, obj],
              ),
          )
        : (diffs as CrossChainAssetDiffsByAddress);

    // Bridge contracts get their own entries, with the movements mirrored.
    const key = Object.keys(byAddress).find(
        address => address.toLowerCase() === accountAddress.toLowerCase(),
    );

    return key ? (byAddress[key] ?? []) : [];
};
