import { decodeUriResult, encodeErc1155UriCall, encodeTokenUriCall } from '../../metadata/evm';

const TOKEN_ID = 42n;

describe('encodeTokenUriCall', () => {
    it('encodes tokenURI(uint256) calldata with selector 0xc87b56dd', () => {
        const data = encodeTokenUriCall(TOKEN_ID);

        expect(data.startsWith('0xc87b56dd')).toBe(true);
        expect(data).toBe(
            '0xc87b56dd000000000000000000000000000000000000000000000000000000000000002a',
        );
    });
});

describe('encodeErc1155UriCall', () => {
    it('encodes uri(uint256) calldata with selector 0x0e89341c', () => {
        const data = encodeErc1155UriCall(TOKEN_ID);

        expect(data.startsWith('0x0e89341c')).toBe(true);
        expect(data).toBe(
            '0x0e89341c000000000000000000000000000000000000000000000000000000000000002a',
        );
    });
});

describe('decodeUriResult', () => {
    it('decodes ABI-encoded string return value', () => {
        // ABI encoding of "ipfs://Qm..." string
        // offset=0x20, length=46, string bytes padded to 32
        const uri = 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq';
        const uriBytes = Buffer.from(uri, 'utf8');
        const lengthHex = uriBytes.length.toString(16).padStart(64, '0');
        const dataHex = Buffer.from(uriBytes).toString('hex').padEnd(
            Math.ceil(uriBytes.length / 32) * 64,
            '0',
        );
        const encoded = `0x${'0000000000000000000000000000000000000000000000000000000000000020'}${lengthHex}${dataHex}` as `0x${string}`;

        expect(decodeUriResult(encoded)).toBe(uri);
    });
});
