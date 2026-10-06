import { isDelegatedIdentityKey } from './isDelegatedIdentityKey';

const delegatedIdentityKey = '0c9d40cd155e7ddb93e7b3c7b2acd8d75e7a3ebd543a3504c8f8164fb692772b';

describe(isDelegatedIdentityKey.name, () => {
    it.each([delegatedIdentityKey, delegatedIdentityKey.toUpperCase()])(
        'accepts a delegated identity key',
        value => {
            expect(isDelegatedIdentityKey(value)).toBe(true);
        },
    );

    it.each(['', delegatedIdentityKey.slice(2), `${delegatedIdentityKey.slice(0, -1)}z`])(
        'rejects an invalid delegated identity key',
        value => {
            expect(isDelegatedIdentityKey(value)).toBe(false);
        },
    );
});
