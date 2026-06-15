import { err, ok } from '@trezor/type-utils';

import { getHDPath } from '../getHDPath';

describe(getHDPath.name, () => {
    it.each([
        ['m', ok([])],
        ["m/44'/1'/0'", ok([2147483692, 2147483649, 2147483648])],
        ["m/49/1'/0'", ok([49, 2147483649, 2147483648])],
        ['not-a-path', err({ type: 'PATH_NOT_VALID' as const })],
        ['m/-1', err({ type: 'PATH_NEGATIVE_VALUES' as const })],
    ])('parses %s', (path, result) => {
        expect(getHDPath(path)).toEqual(result);
    });
});
