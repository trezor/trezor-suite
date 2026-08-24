import { buildEnsAddr } from './addr';

const VITALIK_NODE = '0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835';

describe('buildEnsAddr', () => {
    it('encodes the addr profile', () => {
        const result = buildEnsAddr({ node: VITALIK_NODE });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(`0x3b3b57de${VITALIK_NODE.slice(2)}`);
    });

    it('rejects a node that is not 32 bytes', () => {
        const result = buildEnsAddr({ node: '0xdeadbeef' });

        expect(result.isValid).toBe(false);
        expect(result.data).toBeNull();
        expect(result.errors).toEqual([
            expect.objectContaining({ code: 'INVALID_BYTES32', severity: 'error' }),
        ]);
    });
});
