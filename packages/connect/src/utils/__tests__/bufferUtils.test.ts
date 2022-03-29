import { reverseBuffer } from '../bufferUtils';

describe('utils/bufferUtils', () => {
    it('reverseBuffer', () => {
        expect(reverseBuffer(Buffer.from('abcd', 'hex'))).toEqual(Buffer.from('cdab', 'hex'));
    });
});
