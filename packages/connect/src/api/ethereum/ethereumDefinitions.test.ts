import type { MessagesSchema } from '@trezor/protobuf';

import { decodeEthereumDefinition } from './ethereumDefinitions';

// A malformed/truncated `.dat` blob served by the (untrusted) definitions server must not crash
// the ethereum getAddress/signTransaction flow: definitions are display-only, so a poison entry
// has to degrade to `undefined` (UNKNOWN shown) instead of throwing out of the method.
describe('decodeEthereumDefinition poison-definition hardening', () => {
    beforeEach(() => {
        console.warn = jest.fn();
    });

    // `trzd.decode` reads a fixed 12-byte header via readUInt8(5)/readUInt32LE(6)/readUInt16LE(10);
    // a shorter buffer throws RangeError [ERR_OUT_OF_RANGE].
    const shortBuffer = new Uint8Array([0x74, 0x72, 0x7a]).buffer;

    it('does not throw and leaves network undefined for a truncated encoded_network', () => {
        const definitions: MessagesSchema.EthereumDefinitions = { encoded_network: shortBuffer };

        let result: ReturnType<typeof decodeEthereumDefinition> | undefined;
        expect(() => {
            result = decodeEthereumDefinition(definitions);
        }).not.toThrow();

        expect(result?.network).toBeUndefined();
        expect(result?.token).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('unable to decode ethereum encoded_network definition'),
        );
    });

    it('does not throw and leaves token undefined for a truncated encoded_token', () => {
        const definitions: MessagesSchema.EthereumDefinitions = { encoded_token: shortBuffer };

        let result: ReturnType<typeof decodeEthereumDefinition> | undefined;
        expect(() => {
            result = decodeEthereumDefinition(definitions);
        }).not.toThrow();

        expect(result?.token).toBeUndefined();
        expect(console.warn).toHaveBeenCalledWith(
            expect.stringContaining('unable to decode ethereum encoded_token definition'),
        );
    });

    it('does not throw when both encoded entries are malformed', () => {
        const definitions: MessagesSchema.EthereumDefinitions = {
            encoded_network: shortBuffer,
            encoded_token: shortBuffer,
        };

        expect(() => decodeEthereumDefinition(definitions)).not.toThrow();
        expect(decodeEthereumDefinition(definitions)).toEqual({
            network: undefined,
            token: undefined,
        });
    });

    it('returns empty decoded object when no encoded entries are present', () => {
        expect(decodeEthereumDefinition({})).toEqual({ network: undefined, token: undefined });
        expect(console.warn).not.toHaveBeenCalled();
    });
});
