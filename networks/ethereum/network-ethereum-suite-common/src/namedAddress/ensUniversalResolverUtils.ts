import { type Hex, decodeErrorResult, parseAbi } from 'viem';

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
export const buildCalldata = (built: { data: Hex | null }, call: string) => {
    if (!built.data) throw new Error(`Could not build ${call} calldata.`);

    return built.data;
};

export const asHex = (value: string): Hex => (value.startsWith('0x') ? value : `0x${value}`) as Hex;

/**
 * The RPC proxy rejects reverted calls, so revert data reaches us inside an error message
 * rather than as a payload. Dig the ABI-encoded blob back out to tell a name with no record
 * apart from a backend that is simply down.
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

/**
 * Reverts that report an unfinished offchain (CCIP-read) hop rather than a verdict on the name:
 * `OffchainLookup` requests a hop we cannot make over a bare `eth_call`, and `HttpError` reports
 * one that failed. The name may still resolve through a backend able to follow it.
 */
const OFFCHAIN_ERROR_NAMES = ['HttpError', 'OffchainLookup'];

export const isOffchainError = (error: unknown) => {
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
export const isRevertError = (error: unknown) => {
    const errorName = getResolverErrorName(error);

    if (errorName) return !OFFCHAIN_ERROR_NAMES.includes(errorName);

    return /revert/i.test(error instanceof Error ? error.message : String(error));
};
