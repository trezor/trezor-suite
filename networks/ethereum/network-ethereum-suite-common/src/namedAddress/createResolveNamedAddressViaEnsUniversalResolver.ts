import { type Hex, decodeFunctionResult, toHex, trim } from 'viem';
import { namehash, normalize, packetToBytes } from 'viem/ens';

import { Calldata, EVM_ABI } from '@suite-common/calldata';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';

import type { ResolveNamedAddress } from './ResolveNamedAddress';
import type { CallEnsUniversalResolverDep } from './createCallEnsUniversalResolver';
import { buildCalldata, isRevertError } from './ensUniversalResolverUtils';

export type ResolveNamedAddressViaEnsUniversalResolverDeps = CallEnsUniversalResolverDep;

/**
 * Forward-resolve a name to its onchain address.
 *
 * @returns The resolved address, or `null` when the name has no address record.
 */
export const createResolveNamedAddressViaEnsUniversalResolver = (
    deps: ResolveNamedAddressViaEnsUniversalResolverDeps,
): ResolveNamedAddress => {
    /** Run one resolver profile call through `UniversalResolver.resolve` and return its raw result. */
    const resolveProfileData = async (
        name: string,
        symbol: EthereumNetworkSymbol,
        profileData: Hex,
    ) => {
        const response = await deps.callEnsUniversalResolver(
            symbol,
            buildCalldata(
                Calldata.evm.ens.resolve.encode({
                    name: toHex(packetToBytes(name)),
                    data: profileData,
                }),
                'resolve',
            ),
        );

        const [result] = decodeFunctionResult({
            abi: EVM_ABI.ens.resolve,
            functionName: 'resolve',
            data: response,
        });

        return result;
    };

    const decodeAddressResult = (result: Hex) => {
        if (result === '0x') return null;

        const address = decodeFunctionResult({
            abi: EVM_ABI.ens.addr,
            functionName: 'addr',
            data: result,
        });

        return trim(address) === '0x00' ? null : address;
    };

    return async (value, symbol) => {
        // A name no conformant resolver could hold — `isNameLike` accepts shapes ENSIP-15
        // rejects, such as an underscore. Answering "no record" beats falling through to a backend
        // that cannot do better either.
        let name: string;
        try {
            name = normalize(value);
        } catch {
            return null;
        }

        try {
            const result = await resolveProfileData(
                name,
                symbol,
                buildCalldata(Calldata.evm.ens.addr.encode({ node: namehash(name) }), 'addr'),
            );

            return decodeAddressResult(result);
        } catch (error) {
            // A resolver that holds the record answers with the zero address instead of reverting,
            // so a revert of the `addr` profile means the name has no resolver or no record.
            // Falling through to Blockbook for that costs a request and can only fail too.
            if (isRevertError(error)) return null;
            throw error;
        }
    };
};
