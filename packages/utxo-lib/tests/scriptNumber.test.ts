import * as scriptNumber from '../src/script/scriptNumber';
import { fixtures } from './__fixtures__/scriptNumber';

describe('scriptNumber', () => {
    describe('decode', () => {
        fixtures.forEach(f => {
            it(`${f.hex} returns ${f.number}`, () => {
                const actual = scriptNumber.decode(Buffer.from(f.hex, 'hex'), f.bytes);
                expect(actual).toEqual(f.number);
            });
        });
    });

    describe('encode', () => {
        fixtures.forEach(f => {
            it(`${f.number} returns ${f.hex}`, () => {
                const actual = scriptNumber.encode(f.number);
                expect(actual.toString('hex')).toEqual(f.hex);
            });
        });
    });
});
