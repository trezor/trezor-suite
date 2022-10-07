import { reverseBuffer } from '../src/bufferUtils';

describe('bufferUtils', () => {
    it('reverseBuffer', () => {
        expect(reverseBuffer(Buffer.from('abcd', 'hex'))).toEqual(Buffer.from('cdab', 'hex'));

        expect(
            reverseBuffer(
                Buffer.from(
                    '0dac366fd8a67b2a89fbb0d31086e7acded7a5bbf9ef9daa935bc873229ef5b5',
                    'hex',
                ),
            ).toString('hex'),
        ).toEqual('b5f59e2273c85b93aa9deff9bba5d7deace78610d3b0fb892a7ba6d86f36ac0d');
    });
});
