import * as types from '../src/types';

describe('types validation', () => {
    describe('Buffer Hash160/Hash256', () => {
        const buffer20byte = Buffer.alloc(20);
        const buffer32byte = Buffer.alloc(32);

        it('return true for valid size', () => {
            expect(() => types.Hash160bit(buffer20byte)).not.toThrow();
            expect(() => types.Hash256bit(buffer32byte)).not.toThrow();
        });
    });

    describe('Satoshi', () => {
        [
            { value: -1, result: false },
            { value: 0, result: true },
            { value: 1, result: true },
            { value: 20999999 * 1e8, result: true },
            { value: 21000000 * 1e8, result: true },
            { value: 21000001 * 1e8, result: false },
        ].forEach(f => {
            it(`returns ${f.result} for valid for ${f.value}`, () => {
                expect(types.Satoshi(f.value)).toEqual(f.result);
            });
        });
    });
});
