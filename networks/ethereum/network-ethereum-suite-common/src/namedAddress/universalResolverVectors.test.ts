import { decodeFunctionData, parseAbi } from 'viem';

import { resolveNamedAddressOnchain } from './universalResolver';

const mockBlockchainEvmRpcCall = jest.fn();

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        blockchainEvmRpcCall: (...args: unknown[]) => mockBlockchainEvmRpcCall(...args),
    },
}));

/**
 * Golden vectors captured from a real mainnet `cast` session against the deployed
 * UniversalResolver, resolving `vitalik.eth`. They pin the exact bytes on the wire, so a
 * refactor that changes the encoding fails here rather than silently on a user's machine.
 */
const VITALIK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

// `toHex(packetToBytes('vitalik.eth'))`
const DNS_ENCODED_NAME = '0x07766974616c696b0365746800';

// `multicall([addr(namehash('vitalik.eth'))])`
const MULTICALL_CALLDATA =
    '0xac9650d8' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000001' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000024' +
    '3b3b57deee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a' +
    '5347583500000000000000000000000000000000000000000000000000000000';

// The `(bytes result, address resolver)` pair the resolver returned for that call.
const RESOLVE_RETURN =
    '0x0000000000000000000000000000000000000000000000000000000000000040' +
    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
    '00000000000000000000000000000000000000000000000000000000000000a0' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000001' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
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

    it('sends the DNS-encoded name and multicall batch captured from mainnet', async () => {
        await resolveNamedAddressOnchain('vitalik.eth', 'eth');

        const sentCalldata = mockBlockchainEvmRpcCall.mock.calls[0]?.[0].data;
        const { args } = decodeFunctionData({ abi: resolveAbi, data: sentCalldata });
        const [name, data] = args;

        expect(name).toBe(DNS_ENCODED_NAME);
        expect(data).toBe(MULTICALL_CALLDATA);
    });

    it('decodes the mainnet response to the expected address', async () => {
        await expect(resolveNamedAddressOnchain('vitalik.eth', 'eth')).resolves.toBe(
            VITALIK_ADDRESS,
        );
    });
});
