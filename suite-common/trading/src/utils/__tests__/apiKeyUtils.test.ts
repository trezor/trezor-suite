import { getRandomAccountDescriptor } from '../apiKeyUtils';

describe('getRandomAccountDescriptor', () => {
    it('should return 20 characters', () => {
        expect(getRandomAccountDescriptor().length).toBe(20);
    });

    it('should return different string on every call', () => {
        expect(getRandomAccountDescriptor()).not.toBe(getRandomAccountDescriptor());
    });
});
