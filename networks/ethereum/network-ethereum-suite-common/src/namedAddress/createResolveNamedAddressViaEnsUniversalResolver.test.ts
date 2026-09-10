import { decodeFunctionData, encodeErrorResult, parseAbi } from 'viem';

import { createCallEnsUniversalResolver } from './createCallEnsUniversalResolver';
import { createResolveNamedAddressViaEnsUniversalResolver } from './createResolveNamedAddressViaEnsUniversalResolver';

const mockBlockchainEvmRpcCall = jest.fn();

const resolveNamedAddressOnchain = createResolveNamedAddressViaEnsUniversalResolver({
    callEnsUniversalResolver: createCallEnsUniversalResolver({
        getTrezorConnect: () => ({ blockchainEvmRpcCall: mockBlockchainEvmRpcCall }),
    }),
});

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

// `resolve` wrapping the `addr` profile.
const ADDRESS_PROFILE =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

// The same profile answering the zero address: the name exists but points nowhere.
const ADDRESS_PROFILE_ZERO =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000000';

const encodeRevert = (signature: string, errorName: string, args: readonly unknown[]) =>
    encodeErrorResult({
        abi: parseAbi([signature]),
        errorName,
        args,
    } as Parameters<typeof encodeErrorResult>[0]);

const asRevert = (revertData: string) => ({
    success: false,
    error: { message: `execution reverted: ${revertData}` },
});

const revertWith = (revertData: string) => {
    mockBlockchainEvmRpcCall.mockResolvedValue(asRevert(revertData));
};

const succeedWith = (...responses: string[]) => {
    responses.forEach(data =>
        mockBlockchainEvmRpcCall.mockResolvedValueOnce({ success: true, payload: { data } }),
    );
};

const failWith = (message: string) => {
    mockBlockchainEvmRpcCall.mockResolvedValue({ success: false, error: { message } });
};

const RESOLVER_NOT_FOUND = encodeRevert('error ResolverNotFound(bytes name)', 'ResolverNotFound', [
    '0x00',
]);

const UNSUPPORTED_PROFILE = encodeRevert(
    'error UnsupportedResolverProfile(bytes4 selector)',
    'UnsupportedResolverProfile',
    ['0x3b3b57de'],
);

const OFFCHAIN_LOOKUP = encodeRevert(
    'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
    'OffchainLookup',
    [
        '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
        ['https://gateway.example/{sender}/{data}.json'],
        '0xdeadbeef',
        '0xaabbccdd',
        '0x',
    ],
);

describe('resolveNamedAddressOnchain', () => {
    beforeEach(() => {
        mockBlockchainEvmRpcCall.mockReset();
    });

    it('resolves a name to its address in a single request', async () => {
        succeedWith(ADDRESS_PROFILE);

        await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBe(
            VITALIK_ADDRESS,
        );
        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
    });

    it('calls the UniversalResolver on the requested network', async () => {
        succeedWith(ADDRESS_PROFILE);

        await resolveNamedAddressOnchain('vitalik.eth', 'tsep');

        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'tsep',
                to: '0xeeeeeeee14d718c2b47d9923deab1335e144eeee',
            }),
        );
    });

    it('normalizes the name before hashing it', async () => {
        succeedWith(ADDRESS_PROFILE, ADDRESS_PROFILE);

        await resolveNamedAddressOnchain('VITALIK.eth', 'eth');
        const upperCaseCallData = mockBlockchainEvmRpcCall.mock.calls[0]?.[0].data;

        await resolveNamedAddressOnchain('vitalik.eth', 'eth');
        const lowerCaseCallData = mockBlockchainEvmRpcCall.mock.calls[1]?.[0].data;

        expect(upperCaseCallData).toBe(lowerCaseCallData);
    });

    it('returns null when the name has no address record', async () => {
        succeedWith(ADDRESS_PROFILE_ZERO);

        await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBeNull();
    });

    // A resolver holding the record answers with the zero address instead of reverting, so
    // every revert below is an answer about the name — not something a second request or the
    // Blockbook fallback could improve on.
    it.each([
        ['the name has no resolver', RESOLVER_NOT_FOUND],
        ['the resolver does not implement addr', UNSUPPORTED_PROFILE],
    ])('returns null in one request when %s', async (_case, revertData) => {
        revertWith(revertData);

        await expect(resolveNamedAddressOnchain('nope.eth', 'eth')).resolves.toBeNull();
        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
    });

    // Both backends strip revert data, so a bare "execution reverted" is the common case
    // rather than the exception. It must still read as an answer instead of a transport
    // failure that drags in the Blockbook fallback.
    it('returns null when the revert carries no data', async () => {
        failWith('execution reverted');

        await expect(resolveNamedAddressOnchain('cult.et', 'eth')).resolves.toBeNull();
        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
    });

    it('returns null for revert data no known resolver error matches', async () => {
        failWith('reverted: 0xdeadbeefdeadbeef');

        await expect(resolveNamedAddressOnchain('nope.eth', 'eth')).resolves.toBeNull();
    });

    // A direct-RPC backend surfaces viem's `call` error, which quotes the resolver address
    // and our own calldata before any revert data. Those must not be mistaken for it.
    it('finds the revert data further down a quoted request', async () => {
        failWith(
            [
                'execution reverted',
                '',
                'Raw Call Arguments:',
                '  to:    0xeeeeeeee14d718c2b47d9923deab1335e144eeee',
                '  data:  0x206c74c90000000000000000000000000000000000000000000000000000000000000040',
                '',
                `Details: execution reverted: ${RESOLVER_NOT_FOUND}`,
                'Version: viem@2.54.1',
            ].join('\n'),
        );

        await expect(resolveNamedAddressOnchain('nope.eth', 'eth')).resolves.toBeNull();
        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
    });

    // A call that never reached a resolver says nothing about the name, so it has to reach
    // the caller for the fallback to run.
    it('throws when the call never reached a resolver', async () => {
        failWith('Backend not connected');

        await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).rejects.toThrow(
            'Backend not connected',
        );
        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
    });

    // EIP-3668: the record exists but lives offchain and the gateway hop is not implemented
    // here. Reporting that as "no such name" would tell the user a valid name is wrong, so it
    // has to reach the caller for the fallback to try.
    it.each([
        ['an OffchainLookup revert', OFFCHAIN_LOOKUP],
        [
            'an HttpError revert',
            encodeRevert('error HttpError(uint16 status, string message)', 'HttpError', [
                502,
                'Bad Gateway',
            ]),
        ],
    ])('throws on %s so the fallback can follow the hop', async (_case, revertData) => {
        revertWith(revertData);

        await expect(resolveNamedAddressOnchain('offchain.eth', 'eth')).rejects.toThrow();
    });

    // `isNameLike` admits shapes ENSIP-15 normalization rejects. No resolver could
    // hold them, so spending a request — here or on the Blockbook fallback — buys nothing.
    it.each([['.eth'], ['foo_bar.eth']])('answers %s without a request', async invalidName => {
        await expect(resolveNamedAddressOnchain(invalidName, 'eth')).resolves.toBeNull();
        expect(mockBlockchainEvmRpcCall).not.toHaveBeenCalled();
    });
});

/**
 * Golden vectors from a real mainnet `cast` session against the deployed UniversalResolver,
 * resolving `vitalik.eth`. They pin the exact bytes on the wire, so a refactor that changes the
 * encoding fails here rather than silently on a user's machine. The session batched the profile
 * through `multicall`, which resolution no longer does, so the name, namehash, resolver and
 * address words below are the captured ones with that batch wrapper peeled off.
 */
// `toHex(packetToBytes('vitalik.eth'))`
const DNS_ENCODED_NAME = '0x07766974616c696b0365746800';

// `addr(namehash('vitalik.eth'))`
const ADDR_CALLDATA =
    '0x3b3b57de' + 'ee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835';

// The `(bytes result, address resolver)` pair the resolver returned for that profile.
const RESOLVE_RETURN =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

const resolveAbi = parseAbi([
    'function resolve(bytes name, bytes data) view returns (bytes result, address resolver)',
]);

describe('universalResolver mainnet vectors', () => {
    beforeEach(() => {
        mockBlockchainEvmRpcCall.mockReset();
        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: true,
            payload: { data: RESOLVE_RETURN },
        });
    });

    it('sends the DNS-encoded name and addr profile captured from mainnet', async () => {
        await resolveNamedAddressOnchain('vitalik.eth', 'eth');

        const sentCalldata = mockBlockchainEvmRpcCall.mock.calls[0]?.[0].data;
        const { args } = decodeFunctionData({ abi: resolveAbi, data: sentCalldata });
        const [name, data] = args;

        expect(name).toBe(DNS_ENCODED_NAME);
        expect(data).toBe(ADDR_CALLDATA);
    });

    it('decodes the mainnet response to the expected address', async () => {
        await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBe(
            VITALIK_ADDRESS,
        );
    });
});
