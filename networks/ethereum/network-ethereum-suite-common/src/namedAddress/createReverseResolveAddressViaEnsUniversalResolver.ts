import { BaseError, decodeFunctionResult } from 'viem';
import { toCoinType } from 'viem/ens';

import { Calldata, EVM_ABI } from '@suite-common/calldata';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import { BigNumber } from '@trezor/utils';

import type { ReverseResolveAddress } from './ReverseResolveAddress';
import type { CallEnsUniversalResolverDep } from './createCallEnsUniversalResolver';
import { asHex, buildCalldata, isOffchainError, isRevertError } from './ensUniversalResolverUtils';
import { getNamedAddressChainId } from './namedAddressUtils';

/**
 * ENSIP-11 coin type for the network's own chain, which selects the reverse namespace. viem maps
 * chain 1 back to `60`, i.e. the default `addr.reverse`; every other chain gets its own.
 *
 * UNVERIFIED for `tsep`: chain-specific namespaces are normally registered on the L1 whose registry
 * is being queried rather than on the chain itself, and Sepolia stands in for that L1 here — so
 * `addr.reverse` (`60`) may be where its primary names actually live. Nobody has run a successful
 * reverse lookup on Sepolia either way. If reverse comes back empty there while forward resolution
 * works, this is the first place to look. Mainnet is unaffected regardless.
 */
const getReverseCoinType = (symbol: EthereumNetworkSymbol) => {
    const chainId = getNamedAddressChainId(symbol);

    if (chainId === undefined) {
        throw new Error(`Cannot reverse-resolve on ${symbol}: the network has no name system.`);
    }

    return toCoinType(chainId);
};

export type ReverseResolveAddressViaEnsUniversalResolverDeps = CallEnsUniversalResolverDep;

/**
 * Reverse-resolve an address to its primary name.
 *
 * @returns The primary name, or `null` when the address has none.
 */
export const createReverseResolveAddressViaEnsUniversalResolver =
    (deps: ReverseResolveAddressViaEnsUniversalResolverDeps): ReverseResolveAddress =>
    async (address, symbol) => {
        const data = buildCalldata(
            Calldata.evm.ens.reverse.encode({
                lookupAddress: asHex(address),
                // The builder validates the coin type as a uint256, which it expresses as a BigNumber.
                coinType: new BigNumber(getReverseCoinType(symbol).toString()),
            }),
            'reverse',
        );

        try {
            const [primary] = decodeFunctionResult({
                abi: EVM_ABI.ens.reverse,
                functionName: 'reverse',
                data: await deps.callEnsUniversalResolver(symbol, data),
            });

            return primary || null;
        } catch (error) {
            // Every answer the contract can give leaves nothing to display — including one asking for
            // an offchain hop we cannot make — and a truncated response that fails to decode is no
            // different. Nothing blocks on a primary name, so none of it is worth failing over.
            if (isRevertError(error) || isOffchainError(error) || error instanceof BaseError) {
                return null;
            }

            throw error;
        }
    };
