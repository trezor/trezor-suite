import { splitAddressToChunks } from '../splitAddressToChunks';

describe('splitAddressToChunks', () => {
    it('should split the address into chunks of 4 characters', () => {
        const address = '1234567890ABCDEF';
        const result = splitAddressToChunks(address);

        expect(result).toEqual(['1234', '5678', '90AB', 'CDEF']);
    });

    it('should split the address even if its length is not a multiple of 4', () => {
        const address = '1234567890ABCDE';
        const result = splitAddressToChunks(address);

        expect(result).toEqual(['1234', '5678', '90AB', 'CDE']);
    });

    it("should return the whole address in the first chunk if it's shorter than 4 characters array if the address is empty", () => {
        const address = 'ABC';
        const result = splitAddressToChunks(address);

        expect(result).toEqual(['ABC']);
    });

    it('should return an empty array if the address is empty', () => {
        const address = '';
        const result = splitAddressToChunks(address);

        expect(result).toEqual([]);
    });
});
