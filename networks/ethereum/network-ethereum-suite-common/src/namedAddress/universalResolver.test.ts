import { decodeFunctionData, encodeErrorResult, parseAbi } from 'viem';

import {
    isNameUnresolvable,
    isUnsupportedProfileError,
    resolveNamedAddressOnchain,
    resolveNamedProfileOnchain,
    reverseResolveAddressOnchain,
} from './universalResolver';

const mockBlockchainEvmRpcCall = jest.fn();

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        blockchainEvmRpcCall: (...args: unknown[]) => mockBlockchainEvmRpcCall(...args),
    },
}));

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const DESCRIPTION = 'Lead developer of ENS & Ethereum Foundation alum.';

// `resolve` wrapping a `multicall` batch of one `addr` profile.
const MULTICALL_ADDRESS_ONLY =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '00000000000000000000000000000000000000000000000000000000000000a0' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000001' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

// `resolve` wrapping a `multicall` batch of `addr` plus a `description` text record.
const MULTICALL_ADDRESS_AND_TEXT =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '0000000000000000000000000000000000000000000000000000000000000160' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000002' +
    '0000000000000000000000000000000000000000000000000000000000000040' +
    '0000000000000000000000000000000000000000000000000000000000000080' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' +
    '0000000000000000000000000000000000000000000000000000000000000080' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000031' +
    '4c65616420646576656c6f706572206f6620454e53202620457468657265756d' +
    '20466f756e646174696f6e20616c756d2e000000000000000000000000000000';

// A batch whose `addr` entry is the zero address: the name exists but points nowhere.
const MULTICALL_ZERO_ADDRESS =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '00000000000000000000000000000000000000000000000000000000000000a0' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000001' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000000';

// A batch where the resolver answered `addr` but left the text record empty.
const MULTICALL_EMPTY_TEXT =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '00000000000000000000000000000000000000000000000000000000000000e0' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000002' +
    '0000000000000000000000000000000000000000000000000000000000000040' +
    '0000000000000000000000000000000000000000000000000000000000000080' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045' +
    '0000000000000000000000000000000000000000000000000000000000000000';

// `resolve` of a bare `addr` profile, as used when the resolver has no `multicall`.
const ADDRESS_ONLY_PROFILE =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

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

// Queued responses win over the persistent default, so a test that needs one failed call
// followed by a successful one has to queue both.
const revertOnceWith = (revertData: string) => {
    mockBlockchainEvmRpcCall.mockResolvedValueOnce(asRevert(revertData));
};

const succeedWith = (...responses: string[]) => {
    responses.forEach(data =>
        mockBlockchainEvmRpcCall.mockResolvedValueOnce({ success: true, payload: { data } }),
    );
};

const RESOLVER_NOT_FOUND = encodeRevert('error ResolverNotFound(bytes name)', 'ResolverNotFound', [
    '0x00',
]);

const UNSUPPORTED_PROFILE = encodeRevert(
    'error UnsupportedResolverProfile(bytes4 selector)',
    'UnsupportedResolverProfile',
    ['0xac9650d8'],
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

    describe('resolveNamedProfileOnchain', () => {
        it('batches the address and text records into a single request', async () => {
            succeedWith(MULTICALL_ADDRESS_AND_TEXT);

            await expect(
                resolveNamedProfileOnchain('vitalik.eth', 'eth', { textKeys: ['description'] }),
            ).resolves.toEqual({
                address: VITALIK_ADDRESS,
                texts: { description: DESCRIPTION },
            });
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        });

        it('omits text records the resolver left empty', async () => {
            succeedWith(MULTICALL_EMPTY_TEXT);

            await expect(
                resolveNamedProfileOnchain('vitalik.eth', 'eth', { textKeys: ['description'] }),
            ).resolves.toEqual({ address: VITALIK_ADDRESS, texts: {} });
        });

        it('returns an empty profile when the name has no resolver', async () => {
            revertWith(RESOLVER_NOT_FOUND);

            await expect(resolveNamedProfileOnchain('nope.eth', 'eth')).resolves.toEqual({
                address: null,
                texts: {},
            });
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        });
    });

    describe('resolveNamedAddressOnchain', () => {
        it('resolves a name to its address', async () => {
            succeedWith(MULTICALL_ADDRESS_ONLY);

            await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBe(
                VITALIK_ADDRESS,
            );
        });

        it('calls the UniversalResolver on the requested network', async () => {
            succeedWith(MULTICALL_ADDRESS_ONLY);

            await resolveNamedAddressOnchain('vitalik.eth', 'tsep');

            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledWith(
                expect.objectContaining({
                    coin: 'tsep',
                    to: '0xeeeeeeee14d718c2b47d9923deab1335e144eeee',
                }),
            );
        });

        it('sends the lookup on the given backend identity', async () => {
            succeedWith(MULTICALL_ADDRESS_ONLY);

            await resolveNamedAddressOnchain('vitalik.eth', 'eth', { identity: 'deviceState' });

            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledWith(
                expect.objectContaining({ identity: 'deviceState' }),
            );
        });

        it('normalizes the name before hashing it', async () => {
            succeedWith(MULTICALL_ADDRESS_ONLY, MULTICALL_ADDRESS_ONLY);

            await resolveNamedAddressOnchain('VITALIK.eth', 'eth');
            const upperCaseCallData = mockBlockchainEvmRpcCall.mock.calls[0]?.[0].data;

            await resolveNamedAddressOnchain('vitalik.eth', 'eth');
            const lowerCaseCallData = mockBlockchainEvmRpcCall.mock.calls[1]?.[0].data;

            expect(upperCaseCallData).toBe(lowerCaseCallData);
        });

        it('returns null when the name has no address record', async () => {
            succeedWith(MULTICALL_ZERO_ADDRESS);

            await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBeNull();
        });

        it('retries without multicall when the resolver does not implement it', async () => {
            revertOnceWith(UNSUPPORTED_PROFILE);
            succeedWith(ADDRESS_ONLY_PROFILE);

            await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBe(
                VITALIK_ADDRESS,
            );
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(2);
        });

        it('does not retry when the name is definitively unresolvable', async () => {
            revertWith(RESOLVER_NOT_FOUND);

            await expect(resolveNamedAddressOnchain('nope.eth', 'eth')).resolves.toBeNull();
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        });

        // Both backends strip revert data, so a bare "execution reverted" is the common case
        // rather than the exception. It must still stop after the bare `addr` attempt instead
        // of reporting a transport failure and dragging in the Blockbook fallback.
        it('stops after the bare profile when the revert carries no data', async () => {
            mockBlockchainEvmRpcCall.mockResolvedValue({
                success: false,
                error: { message: 'execution reverted' },
            });

            await expect(resolveNamedAddressOnchain('cult.et', 'eth')).resolves.toBeNull();
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(2);
        });

        // The bare retry only makes sense when a resolver answered. A call that never reached one
        // must fail immediately: retrying it pays the timeout twice over before the caller's
        // fallback even starts, which is what leaves the send form validating for a minute.
        it('fails after a single request when the call never reached a resolver', async () => {
            mockBlockchainEvmRpcCall.mockResolvedValue({
                success: false,
                error: { message: 'Backend not connected' },
            });

            await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).rejects.toThrow(
                'Backend not connected',
            );
            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        });

        // EIP-3668: the record exists but lives offchain. Reporting that as "no such name" would
        // tell the user a perfectly valid name is wrong, so it has to reach the caller as a
        // failure and let the fallback try.
        it('does not treat an OffchainLookup revert as a missing record', async () => {
            revertWith(
                encodeRevert(
                    'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                    'OffchainLookup',
                    [
                        '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
                        ['https://gateway.example/{sender}/{data}'],
                        '0x1234',
                        '0xdeadbeef',
                        '0x5678',
                    ],
                ),
            );

            await expect(resolveNamedAddressOnchain('offchain.eth', 'eth')).rejects.toThrow();
        });

        // `isNameLike` admits shapes ENSIP-15 normalization rejects. No resolver could
        // hold them, so spending a request — here or on the Blockbook fallback — buys nothing.
        it.each([['.eth'], ['foo_bar.eth']])('answers %s without a request', async invalidName => {
            await expect(resolveNamedAddressOnchain(invalidName, 'eth')).resolves.toBeNull();
            expect(mockBlockchainEvmRpcCall).not.toHaveBeenCalled();
        });

        // EIP-3668: the record lives offchain and the gateway hop is not implemented here, so
        // this is not a verdict on the name. It has to reach the caller for the fallback to run.
        it('throws on an OffchainLookup revert so the fallback can follow the hop', async () => {
            revertWith(OFFCHAIN_LOOKUP);

            await expect(resolveNamedAddressOnchain('offchain.eth', 'eth')).rejects.toThrow();
        });

        it('throws on an HttpError revert, which signals a failed offchain hop', async () => {
            revertWith(
                encodeRevert('error HttpError(uint16 status, string message)', 'HttpError', [
                    502,
                    'Bad Gateway',
                ]),
            );

            await expect(resolveNamedAddressOnchain('offchain.eth', 'eth')).rejects.toThrow();
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

        it('sends the lookup on the given backend identity', async () => {
            succeedWith(REVERSE_SUCCESS);

            await reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth', { identity: 'deviceState' });

            expect(mockBlockchainEvmRpcCall).toHaveBeenCalledWith(
                expect.objectContaining({ identity: 'deviceState' }),
            );
        });

        it('returns null when the address has no primary name', async () => {
            succeedWith(REVERSE_EMPTY);

            await expect(reverseResolveAddressOnchain(VITALIK_ADDRESS, 'eth')).resolves.toBeNull();
        });

        it('returns null when the revert carries no data', async () => {
            mockBlockchainEvmRpcCall.mockResolvedValue({
                success: false,
                error: { message: 'execution reverted' },
            });

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

    describe('error classification', () => {
        it('separates an unresolvable name from an unsupported profile', () => {
            const notFound = new Error(`reverted: ${RESOLVER_NOT_FOUND}`);
            const unsupported = new Error(`reverted: ${UNSUPPORTED_PROFILE}`);

            expect(isNameUnresolvable(notFound)).toBe(true);
            expect(isUnsupportedProfileError(notFound)).toBe(false);

            expect(isNameUnresolvable(unsupported)).toBe(false);
            expect(isUnsupportedProfileError(unsupported)).toBe(true);
        });

        it('classifies an error carrying no revert data as neither', () => {
            const error = new Error('Backend not connected');

            expect(isNameUnresolvable(error)).toBe(false);
            expect(isUnsupportedProfileError(error)).toBe(false);
        });

        // A direct-RPC backend surfaces viem's `call` error, which quotes the resolver address
        // and our own calldata before any revert data. Those must not be mistaken for it.
        it('skips the quoted request and finds the revert data further down the message', () => {
            const error = new Error(
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

            expect(isNameUnresolvable(error)).toBe(true);
        });

        // Same shape, but viem kept the revert data on the error object rather than in the
        // message. Unclassified must mean transient, never a silent "no such name".
        it('treats a revert whose data never reached the message as transient', () => {
            const error = new Error(
                [
                    'execution reverted',
                    '',
                    'Raw Call Arguments:',
                    '  to:    0xeeeeeeee14d718c2b47d9923deab1335e144eeee',
                    '  data:  0x206c74c90000000000000000000000000000000000000000000000000000000000000040',
                    '',
                    'Version: viem@2.54.1',
                ].join('\n'),
            );

            expect(isNameUnresolvable(error)).toBe(false);
            expect(isUnsupportedProfileError(error)).toBe(false);
        });

        it('classifies unrecognised revert data as neither', () => {
            const error = new Error('reverted: 0xdeadbeefdeadbeef');

            expect(isNameUnresolvable(error)).toBe(false);
            expect(isUnsupportedProfileError(error)).toBe(false);
        });
    });
});
