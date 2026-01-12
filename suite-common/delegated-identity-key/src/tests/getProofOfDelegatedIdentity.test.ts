import { asDelegatedIdentityKey } from '@suite-common/suite-types';

import { getProofOfDelegatedIdentity } from '../getProofOfDelegatedIdentity';

describe(getProofOfDelegatedIdentity.name, () => {
    it('calculates the proof', () => {
        const proof = getProofOfDelegatedIdentity({
            delegatedKey: asDelegatedIdentityKey(
                '0c9d40cd155e7ddb93e7b3c7b2acd8d75e7a3ebd543a3504c8f8164fb692772b',
            ),
            header: 'EvoluGetNode',
        });

        expect(proof.success).toBe(true);
        expect(proof.success && proof.payload).toBe(
            '75207c8e657c8b9a885c491f2407ce6b2ab28c88914a1f20b4a12d25a5103df171dd1f4137733466491d53891233c200e0500effaeab9270bf294ab08f32b41e',
        );
    });
});
