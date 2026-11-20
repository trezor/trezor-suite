import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { err, ok } from '@trezor/type-utils';

import { ProofOfDelegatedSignFailed } from './getProofOfDelegatedIdentity';
import { getPublicIdentityKeyFromDelegatedKey } from './getPublicIdentityKeyFromDeletegatedKey';

const expectedPublicKey =
    '0428a3cefc19b41ff56795e371aab72d6d85a3ca2200bd46c54e611a36222295a88b44d6f23ce94025b6010f9eb0f9168ad35d8396dc865fa0a16f2f5471816a45';

describe(getPublicIdentityKeyFromDelegatedKey.name, () => {
    afterEach(() => {
        jest.dontMock('@noble/curves/nist.js');
    });

    it('derives the uncompressed public key', async () => {
        expect(await getPublicIdentityKeyFromDelegatedKey(DELEGATED_IDENTITY_KEY)).toEqual(
            ok(expectedPublicKey),
        );
    });

    it('returns ProofOfDelegatedSignFailed when the curve fails to load and loads it on the next call', async () => {
        const loadError = new Error('Loading chunk failed');
        const actualCurves = jest.requireActual('@noble/curves/nist.js');
        const loadCurves = jest
            .fn()
            .mockImplementationOnce(() => {
                throw loadError;
            })
            .mockImplementation(() => actualCurves);

        await jest.isolateModulesAsync(async () => {
            jest.doMock('@noble/curves/nist.js', loadCurves);
            const isolated = await import('./getPublicIdentityKeyFromDeletegatedKey');

            expect(
                await isolated.getPublicIdentityKeyFromDelegatedKey(DELEGATED_IDENTITY_KEY),
            ).toEqual(err(ProofOfDelegatedSignFailed(loadError)));
            expect(
                await isolated.getPublicIdentityKeyFromDelegatedKey(DELEGATED_IDENTITY_KEY),
            ).toEqual(ok(expectedPublicKey));
        });

        expect(loadCurves).toHaveBeenCalledTimes(2);
    });
});
