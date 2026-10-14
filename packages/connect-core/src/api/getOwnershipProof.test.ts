import type { GetOwnershipProof as GetOwnershipProofParams } from '@trezor/connect-common';

import GetOwnershipProof from './getOwnershipProof';

const base: GetOwnershipProofParams = {
    path: "m/84'/1'/0'/0/0",
    coin: 'test',
};

const getPermissions = (params: GetOwnershipProofParams) =>
    new GetOwnershipProof({ payload: { method: 'getOwnershipProof', ...params } })
        .requiredPermissions;

describe('GetOwnershipProof requiredPermissions', () => {
    it('requires read_account_info for a regular proof', () => {
        expect(getPermissions(base)).toEqual([{ permission: 'read_account_info', coin: 'test' }]);
    });

    it('requires internal for a preauthorized proof, like authorizeCoinjoin', () => {
        expect(getPermissions({ ...base, preauthorized: true })).toContainEqual({
            permission: 'internal',
            coin: 'test',
        });
    });
});
