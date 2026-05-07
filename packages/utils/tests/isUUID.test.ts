import { isUUID } from '../src/isUUID';

describe('isUUID', () => {
    it('returns true for valid UUIDs', () => {
        expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(isUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
        expect(isUUID('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toBe(true);
        expect(isUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
    });

    it('returns false for invalid UUIDs', () => {
        expect(isUUID('')).toBe(false);
        expect(isUUID('not-a-uuid')).toBe(false);
        expect(isUUID('550e8400-e29b-41d4-a716')).toBe(false);
        expect(isUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false);
        expect(isUUID('550e8400e29b41d4a716446655440000')).toBe(false);
    });
});
