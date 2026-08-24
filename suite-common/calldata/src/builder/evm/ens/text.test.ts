import { buildEnsText } from './text';

const VITALIK_NODE = '0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835';

describe('buildEnsText', () => {
    it('encodes the text profile', () => {
        const result = buildEnsText({ node: VITALIK_NODE, key: 'description' });

        expect(result.isValid).toBe(true);
        expect(result.data).toBe(
            '0x59d1d43c' +
                VITALIK_NODE.slice(2) +
                '0000000000000000000000000000000000000000000000000000000000000040' +
                '000000000000000000000000000000000000000000000000000000000000000b' +
                '6465736372697074696f6e000000000000000000000000000000000000000000',
        );
    });
});
