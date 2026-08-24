import { buildEnsResolve } from './resolve';

const VITALIK_NODE = '0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835';
const ADDR_CALLDATA = `0x3b3b57de${VITALIK_NODE.slice(2)}`;
const DNS_ENCODED_NAME = '0x07766974616c696b0365746800';

describe('buildEnsResolve', () => {
    it('wraps a DNS-encoded name and a profile call', () => {
        const result = buildEnsResolve({ name: DNS_ENCODED_NAME, data: ADDR_CALLDATA });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x9061b923' +
                '0000000000000000000000000000000000000000000000000000000000000040' +
                '0000000000000000000000000000000000000000000000000000000000000080' +
                '000000000000000000000000000000000000000000000000000000000000000d' +
                '07766974616c696b03657468000000000000000000000000000000000000000000' +
                '00000000000000000000000000000000000000000000000000000000000024' +
                '3b3b57deee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a' +
                '5347583500000000000000000000000000000000000000000000000000000000',
        );
    });

    it('rejects a name that is not hex', () => {
        const result = buildEnsResolve({ name: 'vitalik.eth', data: ADDR_CALLDATA });

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual([
            expect.objectContaining({ code: 'INVALID_BYTES', path: 'name' }),
        ]);
    });
});
