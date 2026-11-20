import { DELEGATED_IDENTITY_KEY } from '@suite-common/delegated-identity-key-types/mocks';
import { err } from '@trezor/type-utils';

import {
    ProofOfDelegatedSignFailed,
    getProofOfDelegatedIdentity,
} from './getProofOfDelegatedIdentity';

const params = {
    delegatedKey: DELEGATED_IDENTITY_KEY,
    header: 'EvoluGetNode',
};

const expectedProof =
    '75207c8e657c8b9a885c491f2407ce6b2ab28c88914a1f20b4a12d25a5103df171dd1f4137733466491d53891233c200e0500effaeab9270bf294ab08f32b41e';

describe(getProofOfDelegatedIdentity.name, () => {
    afterEach(() => {
        jest.dontMock('@noble/curves/nist.js');
    });

    it('calculates the proof', async () => {
        const proof = await getProofOfDelegatedIdentity(params);

        expect(proof.success).toBe(true);
        expect(proof.success && proof.payload).toBe(expectedProof);
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
            const isolated = await import('./getProofOfDelegatedIdentity');

            expect(await isolated.getProofOfDelegatedIdentity(params)).toEqual(
                err(ProofOfDelegatedSignFailed(loadError)),
            );

            const proof = await isolated.getProofOfDelegatedIdentity(params);

            expect(proof.success && proof.payload).toBe(expectedProof);
        });

        expect(loadCurves).toHaveBeenCalledTimes(2);
    });
});
