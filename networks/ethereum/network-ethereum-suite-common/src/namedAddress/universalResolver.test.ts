import { decodeFunctionData, encodeErrorResult, parseAbi } from 'viem';

import { resolveNamedAddressOnchain, reverseResolveAddressOnchain } from './universalResolver';

const mockBlockchainEvmRpcCall = jest.fn();

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        blockchainEvmRpcCall: (...args: unknown[]) => mockBlockchainEvmRpcCall(...args),
    },
}));

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

// `reverse` returning the primary name "nick.eth".
const REVERSE_SUCCESS =
    '0x0000000000000000000000000000000000000000000000000000000000000060' +
    '0000000000000000000000004976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41' +
    '000000000000000000000000a2c122be93b0074270ebee7f6b7292c7deb45047' +
    '0000000000000000000000000000000000000000000000000000000000000008' +
    '6e69636b2e657468000000000000000000000000000000000000000000000000';

// `reverse` for an address with no primary name.
const REVERSE_EMPTY =
    '0x0000000000000000000000000000000000000000000000000000000000000060' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '0000000000000000000000000000000000000000000000000000000000000000' +
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

describe('universalResolver', () => {
    beforeEach(() => {
        mockBlockchainEvmRpcCall.mockReset();
    });

    describe('resolveNamedAddressOnchain', () => {
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

    describe('reverseResolveAddressOnchain', () => {
        const reverseAbi = parseAbi([
            'function reverse(bytes lookupAddress, uint256 coinType) view returns (string primary, address resolver, address reverseResolver)',
        ]);

        const getSentCoinType = () => {
            const { args } = decodeFunctionData({
                abi: reverseAbi,
                data: mockBlockchainEvmRpcCall.mock.calls[0]?.[0].data,
            });

            return args[1];
        };

        // Both networks we resolve on are L1s, whose registries keep primary names in the default
        // `addr.reverse` namespace. Sepolia's own chain namespace is live but empty, so asking for
        // it returns nothing — see `REVERSE_COIN_TYPE`.
        // ENSIP-11 via viem's `toCoinType`: chain 1 maps back to 60 (`addr.reverse`), while
        // Sepolia (11155111) gets its own reverse namespace. The tsep case is unverified against
        // a live resolver — see the note on `getReverseCoinType`.
        it.each([
            ['eth', 60n],
            ['tsep', 2158638759n],
        ] as const)('asks for the chain coin type on %s', async (symbol, expectedCoinType) => {
            succeedWith(REVERSE_SUCCESS);

            await reverseResolveAddressOnchain(VITALIK_ADDRESS, symbol);

            expect(getSentCoinType()).toBe(expectedCoinType);
        });

        it('resolves an address to its primary name', async () => {
            succeedWith(REVERSE_SUCCESS);

            await expect(reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth')).resolves.toBe(
                'nick.eth',
            );
        });

        it('returns null when the address has no primary name', async () => {
            succeedWith(REVERSE_EMPTY);

            await expect(reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth')).resolves.toBeNull();
        });

        it('returns null when the revert carries no data', async () => {
            failWith('execution reverted');

            await expect(reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth')).resolves.toBeNull();
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        });

        // Nothing blocks on a primary name, so an offchain hop we cannot follow is simply no
        // name to show rather than a query failure worth retrying.
        it('returns null when the reverse resolver asks for an offchain hop', async () => {
            revertWith(OFFCHAIN_LOOKUP);

            await expect(reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth')).resolves.toBeNull();
        });

        it('returns null when the resolver reports a reverse mismatch', async () => {
            revertWith(
                encodeRevert(
                    'error ReverseAddressMismatch(string primary, bytes primaryAddress)',
                    'ReverseAddressMismatch',
                    ['nick.eth', '0x00'],
                ),
            );

            await expect(reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth')).resolves.toBeNull();
        });
    });
});
