import { buildEnsMulticall } from './multicall';

const VITALIK_NODE = '0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835';
const ADDR_CALLDATA = `0x3b3b57de${VITALIK_NODE.slice(2)}`;

describe('buildEnsMulticall', () => {
    it('batches profile calls', () => {
        const result = buildEnsMulticall({ data: [ADDR_CALLDATA] });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0xac9650d8' +
                '0000000000000000000000000000000000000000000000000000000000000020' +
                '0000000000000000000000000000000000000000000000000000000000000001' +
                '0000000000000000000000000000000000000000000000000000000000000020' +
                '0000000000000000000000000000000000000000000000000000000000000024' +
                '3b3b57deee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a' +
                '5347583500000000000000000000000000000000000000000000000000000000',
        );
    });

    it('rejects a batch entry that is not whole bytes', () => {
        const result = buildEnsMulticall({ data: [ADDR_CALLDATA, '0xabc'] });

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual([
            expect.objectContaining({ code: 'INVALID_BYTES', path: 'data[1]' }),
        ]);
    });
});
