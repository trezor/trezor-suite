import * as bcrypto from '../src/crypto';
import { fixtures } from './__fixtures__/crypto';

describe('crypto', () => {
    const a = ['hash160', 'hash256', 'ripemd160', 'sha1', 'sha256'] as const;
    a.forEach(algorithm => {
        describe(algorithm, () => {
            fixtures.forEach(f => {
                const fn = bcrypto[algorithm];
                const expected = f[algorithm];

                it(`returns ${expected} for ${f.hex}`, () => {
                    const data = Buffer.from(f.hex, 'hex');
                    const actual = fn(data).toString('hex');

                    expect(actual).toEqual(expected);
                });
            });
        });
    });
});
