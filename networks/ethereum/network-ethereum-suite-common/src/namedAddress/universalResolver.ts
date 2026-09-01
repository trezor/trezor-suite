import {
    BaseError,
    type Hex,
    decodeErrorResult,
    decodeFunctionResult,
    parseAbi,
    toHex,
    trim,
} from 'viem';
import { namehash, normalize, packetToBytes, toCoinType } from 'viem/ens';

import { Calldata, EVM_ABI } from '@suite-common/calldata';
import TrezorConnect from '@trezor/connect';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum/constants';
import { BigNumber } from '@trezor/utils';

import { getNamedAddressChainId } from './namedAddressUtils';

type NamedAddressProfile = {
    address: string | null;
    texts: Record<string, string>;
};

const RESOLVE_TIMEOUT_MS = 15_000;

// ENSIP-19 UniversalResolver. Deployed at the same address on every chain we support,
// mainnet and Sepolia included (see viem's `chains` contract registry).
const UNIVERSAL_RESOLVER_ADDRESS = '0xeeeeeeee14d718c2b47d9923deab1335e144eeee';

// `eth_call` needs a sender; a read against the resolver does not care which.
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

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

const universalResolverErrorsAbi = parseAbi([
    'error ResolverNotFound(bytes name)',
    'error ResolverNotContract(bytes name, address resolver)',
    'error UnsupportedResolverProfile(bytes4 selector)',
    'error ResolverError(bytes errorData)',
    'error ReverseAddressMismatch(string primary, bytes primaryAddress)',
    'error HttpError(uint16 status, string message)',
    // EIP-3668. Not raised by the UniversalResolver itself; it is how a resolver signals that the
    // record lives offchain. Decoded only to classify it — the gateway hop is not implemented.
    'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
]);

/**
 * Calldata is built through `@suite-common/calldata` so the ABIs and the encoding live where every
 * other EVM call in the app keeps them. A builder validates its params before encoding and reports
 * failure in `data`, so an unbuildable call is a programming error rather than a bad request.
 */
const buildCalldata = (built: { data: Hex | null }, call: string) => {
    if (!built.data) throw new Error(`Could not build ${call} calldata.`);

    return built.data;
};

// The name genuinely has no record. Distinct from `UnsupportedResolverProfile`, which only
// says the resolver does not implement the profile we asked for.
const UNRESOLVABLE_ERROR_NAMES = [
    'ResolverNotFound',
    'ResolverNotContract',
    'ResolverError',
    'ReverseAddressMismatch',
];

const EMPTY_PROFILE: NamedAddressProfile = { address: null, texts: {} };

const asHex = (value: string): Hex => (value.startsWith('0x') ? value : `0x${value}`) as Hex;

/**
 * The RPC proxy rejects reverted calls, so revert data reaches us inside an error message
 * rather than as a payload. Dig the ABI-encoded blob back out to tell apart a name with no
 * record, a profile the resolver does not implement, and a backend that is simply down.
 *
 * The message also quotes the request itself (the resolver address and our calldata), so every
 * hex blob is tried and the first one that decodes as a known error wins. Blobs that are not
 * revert data fail to decode, since their leading selector is never one of the errors above.
 * A message carrying no revert data at all — viem keeps it on the error object, which does not
 * survive the worker boundary — stays unclassified and is therefore treated as transient.
 */
const getResolverErrorName = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);

    for (const candidate of message.match(/0x[0-9a-fA-F]{8,}/g) ?? []) {
        try {
            return decodeErrorResult({ abi: universalResolverErrorsAbi, data: candidate as Hex })
                .errorName;
        } catch {
            continue;
        }
    }

    return undefined;
};

export const isNameUnresolvable = (error: unknown) => {
    const errorName = getResolverErrorName(error);

    return !!errorName && UNRESOLVABLE_ERROR_NAMES.includes(errorName);
};

export const isUnsupportedProfileError = (error: unknown) =>
    getResolverErrorName(error) === 'UnsupportedResolverProfile';

/**
 * Reverts that report an unfinished offchain (CCIP-read) hop rather than a verdict on the name:
 * `OffchainLookup` requests a hop we cannot make over a bare `eth_call`, and `HttpError` reports
 * one that failed. The name may still resolve through a backend able to follow it.
 */
const OFFCHAIN_ERROR_NAMES = ['HttpError', 'OffchainLookup'];

const isOffchainError = (error: unknown) => {
    const errorName = getResolverErrorName(error);

    return !!errorName && OFFCHAIN_ERROR_NAMES.includes(errorName);
};

/**
 * Both backends strip revert data — Blockbook answers a bare "execution reverted" — so a
 * decodable custom error is a bonus, never something to rely on. Treat a revert as a real
 * answer from the contract rather than a transport failure worth retrying elsewhere.
 *
 * The offchain-hop reverts are the exception: they leave the question open, so the name may well
 * resolve through the fallback. When no data survived we cannot tell such a revert apart from a
 * definitive one, and the definitive reading is the common case.
 */
const isRevertError = (error: unknown) => {
    const errorName = getResolverErrorName(error);

    if (errorName) return !OFFCHAIN_ERROR_NAMES.includes(errorName);

    return /revert/i.test(error instanceof Error ? error.message : String(error));
};

const callUniversalResolver = async (symbol: EthereumNetworkSymbol, data: Hex) => {
    // The loser of the race has to be cleaned up: an uncleared timer keeps the event loop
    // busy for the full timeout after every single resolution.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        const response = await Promise.race([
            TrezorConnect.blockchainEvmRpcCall({
                coin: symbol,
                from: ZERO_ADDRESS,
                to: UNIVERSAL_RESOLVER_ADDRESS,
                data,
            }),
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('Name resolution timed out')),
                    RESOLVE_TIMEOUT_MS,
                );
            }),
        ]);

        if (!response.success) {
            throw new Error(response.error.message);
        }

        return asHex(response.payload.data);
    } finally {
        clearTimeout(timeoutId);
    }
};

/** Run one resolver profile call through `UniversalResolver.resolve` and return its raw result. */
const resolveProfileData = async (
    name: string,
    symbol: EthereumNetworkSymbol,
    profileData: Hex,
) => {
    const response = await callUniversalResolver(
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

/**
 * Batch every requested profile into the resolver's own `multicall` so one proxied request
 * covers the address and any text records.
 */
const resolveProfileViaMulticall = async (
    name: string,
    node: Hex,
    symbol: EthereumNetworkSymbol,
    textKeys: readonly string[],
): Promise<NamedAddressProfile> => {
    const profileCalls = [
        buildCalldata(Calldata.evm.ens.addr.encode({ node }), 'addr'),
        ...textKeys.map(key => buildCalldata(Calldata.evm.ens.text.encode({ node, key }), 'text')),
    ];

    const result = await resolveProfileData(
        name,
        symbol,
        buildCalldata(Calldata.evm.ens.multicall.encode({ data: profileCalls }), 'multicall'),
    );

    const [addressResult, ...textResults] = decodeFunctionResult({
        abi: EVM_ABI.ens.multicall,
        functionName: 'multicall',
        data: result,
    });

    // A resolver may answer some profiles and leave others empty, so decode entry by entry.
    const texts = textKeys.reduce<Record<string, string>>((accumulator, key, index) => {
        const textResult = textResults[index];
        if (!textResult || textResult === '0x') return accumulator;

        try {
            const value = decodeFunctionResult({
                abi: EVM_ABI.ens.text,
                functionName: 'text',
                data: textResult,
            });
            if (value) accumulator[key] = value;
        } catch {
            // Leave the key out rather than failing the whole profile.
        }

        return accumulator;
    }, {});

    return { address: addressResult ? decodeAddressResult(addressResult) : null, texts };
};

const resolveAddressOnly = async (name: string, node: Hex, symbol: EthereumNetworkSymbol) => {
    try {
        const result = await resolveProfileData(
            name,
            symbol,
            buildCalldata(Calldata.evm.ens.addr.encode({ node }), 'addr'),
        );

        return decodeAddressResult(result);
    } catch (error) {
        // A resolver that holds the record answers with the zero address instead of reverting,
        // so a revert of the bare `addr` profile means the name has no resolver or no record.
        // Falling through to Blockbook for that costs a request and can only fail too.
        if (isRevertError(error)) return null;
        throw error;
    }
};

/**
 * Forward-resolve a name to its address and any requested text records.
 *
 * @returns The profile; `address` is `null` when the name has no address record.
 */
export const resolveNamedProfileOnchain = async (
    value: string,
    symbol: EthereumNetworkSymbol,
    textKeys: readonly string[] = [],
): Promise<NamedAddressProfile> => {
    // A name no conformant resolver could hold — `isNameLike` accepts shapes ENSIP-15
    // rejects, such as an empty label. Answering "no record" beats falling through to a backend
    // that cannot do better either.
    let name: string;
    try {
        name = normalize(value);
    } catch {
        return EMPTY_PROFILE;
    }

    const node = namehash(name);

    try {
        return await resolveProfileViaMulticall(name, node, symbol, textKeys);
    } catch (error) {
        if (isNameUnresolvable(error)) return EMPTY_PROFILE;

        // The bare retry exists for exactly two reasons — the resolver may not implement
        // `multicall`, or its batch response did not decode — and both surface as a revert or a
        // viem decode error. Anything else means the call never reached a resolver, so retrying
        // it here only pays the timeout a second time before the caller's fallback runs.
        if (!isRevertError(error) && !(error instanceof BaseError)) throw error;

        // `multicall` is optional for a resolver, and a malformed batch response decodes just as
        // badly as a missing one. Either way the address is still reachable on its own.
        return { address: await resolveAddressOnly(name, node, symbol), texts: {} };
    }
};

/**
 * Forward-resolve a name to its onchain address.
 *
 * @returns The resolved address, or `null` when the name has no address record.
 */
export const resolveNamedAddressOnchain = async (value: string, symbol: EthereumNetworkSymbol) =>
    (await resolveNamedProfileOnchain(value, symbol)).address;

/**
 * Reverse-resolve an address to its primary name.
 *
 * @returns The primary name, or `null` when the address has none.
 */
export const reverseResolveAddressOnchain = async (
    address: string,
    symbol: EthereumNetworkSymbol,
) => {
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
            data: await callUniversalResolver(symbol, data),
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
