import { decodeFunctionData, encodeErrorResult, parseAbi } from 'viem';

import { createCallEnsUniversalResolver } from './createCallEnsUniversalResolver';
import { createReverseResolveAddressViaEnsUniversalResolver } from './createReverseResolveAddressViaEnsUniversalResolver';

const mockBlockchainEvmRpcCall = jest.fn();

const reverseResolveAddressOnchain = createReverseResolveAddressViaEnsUniversalResolver({
    callEnsUniversalResolver: createCallEnsUniversalResolver({
        getTrezorConnect: () => ({ blockchainEvmRpcCall: mockBlockchainEvmRpcCall }),
    }),
});

const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

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

describe('reverseResolveAddressOnchain', () => {
    beforeEach(() => {
        mockBlockchainEvmRpcCall.mockReset();
    });

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
