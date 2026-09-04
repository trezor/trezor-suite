import { encodeErrorResult, parseAbi } from 'viem';

import { resolveNamedAddress } from './resolveNamedAddress';

const mockBlockchainEvmRpcCall = jest.fn();
const mockGetAccountInfo = jest.fn();

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        blockchainEvmRpcCall: (...args: unknown[]) => mockBlockchainEvmRpcCall(...args),
        getAccountInfo: (...args: unknown[]) => mockGetAccountInfo(...args),
    },
}));

/**
 * Guards the number of requests a single resolution costs, through the real resolver and its
 * Blockbook fallback. A backend that answers a bare "execution reverted" — which is what both
 * Blockbook and a direct RPC actually send — used to cost twelve requests for one mistyped
 * name: three tiers of fallback times four query attempts. The query layer contributes the
 * retry half of that product; `namedAddressQuery.test.ts` guards it.
 *
 * One request per resolution is the floor: the address is asked for on its own, so there is no
 * batch to fall back from.
 */
const RESOLVED_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('resolution request cost', () => {
    beforeEach(() => {
        mockBlockchainEvmRpcCall.mockReset();
        mockGetAccountInfo.mockReset();
    });

    it('costs one request and no error for a name that does not exist', async () => {
        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: false,
            error: { message: 'execution reverted' },
        });

        const resolved = await resolveNamedAddress('cult.et', 'eth');

        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        // A definitive answer, so no Blockbook fallback.
        expect(mockGetAccountInfo).not.toHaveBeenCalled();
        // Resolving to `null` rather than rejecting is what keeps this out of the error log.
        expect(resolved).toBeNull();
    });

    it('costs one request for a name that resolves', async () => {
        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: true,
            payload: {
                data:
                    '0x0000000000000000000000000000000000000000000000000000000000000040' +
                    '000000000000000000000000231b0ee14048e9dccd1d247744d114a4eb5e8e63' +
                    '0000000000000000000000000000000000000000000000000000000000000020' +
                    '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045',
            },
        });

        const resolved = await resolveNamedAddress('vitalik.eth', 'eth');

        expect(resolved).toBe(RESOLVED_ADDRESS);
        expect(mockBlockchainEvmRpcCall).toHaveBeenCalledTimes(1);
        expect(mockGetAccountInfo).not.toHaveBeenCalled();
    });

    // An offchain (CCIP-read) name is not a name that does not exist. Reporting it as one is how
    // a perfectly valid L2/gasless name ends up telling the user to check their spelling.
    it('hands an offchain name to Blockbook rather than calling it unresolvable', async () => {
        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: false,
            error: {
                message: `execution reverted: ${encodeErrorResult({
                    abi: parseAbi([
                        'error OffchainLookup(address sender, string[] urls, bytes callData, bytes4 callbackFunction, bytes extraData)',
                    ]),
                    errorName: 'OffchainLookup',
                    args: [
                        '0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63',
                        ['https://gateway.example/{sender}/{data}.json'],
                        '0xdeadbeef',
                        '0xaabbccdd',
                        '0x',
                    ],
                })}`,
            },
        });
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: RESOLVED_ADDRESS },
        });

        const resolved = await resolveNamedAddress('offchain.eth', 'eth');

        expect(resolved).toBe(RESOLVED_ADDRESS);
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    it('falls back to Blockbook only when the backend is genuinely unreachable', async () => {
        mockBlockchainEvmRpcCall.mockResolvedValue({
            success: false,
            error: { message: 'Backend not connected' },
        });
        mockGetAccountInfo.mockResolvedValue({
            success: true,
            payload: { descriptor: RESOLVED_ADDRESS },
        });

        const resolved = await resolveNamedAddress('vitalik.eth', 'eth');

        expect(resolved).toBe(RESOLVED_ADDRESS);
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });
});
