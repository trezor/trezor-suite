import stellar from '@trezor/network-stellar/runtime';

type StellarRuntime = Awaited<ReturnType<typeof stellar>>;
let runtime: StellarRuntime | undefined;
let loading: Promise<StellarRuntime> | undefined;

const getAddresses = (contract: string, stellarRuntime: StellarRuntime): readonly string[] => {
    try {
        return [
            contract,
            stellarRuntime.computeSorobanAssetContractId(contract).sorobanAssetContractId,
        ];
    } catch {
        // Malformed classic IDs can still have an existing logo on the CDN.
        return [contract];
    }
};

export const getStellarTokenLogoAddresses = (
    contract: string,
): readonly string[] | Promise<readonly string[]> => {
    if (runtime) return getAddresses(contract, runtime);
    loading ??= stellar().then(loaded => {
        runtime = loaded;

        return loaded;
    });

    return loading.then(loaded => getAddresses(contract, loaded));
};
