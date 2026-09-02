import { isSuiteSyncOwner } from './isSuiteSyncOwner';
import {
    type SuiteSyncOwner,
    asSuiteSyncOwnerId,
    asSuiteSyncOwnerSecretHex,
    serializeSuiteSyncOwner,
} from './suiteSyncOwner';

const suiteSyncOwner: SuiteSyncOwner = {
    ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
    ownerSecret: asSuiteSyncOwnerSecretHex(
        'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5',
    ),
};

describe(isSuiteSyncOwner.name, () => {
    it('accepts a serialized Suite Sync owner', () => {
        expect(isSuiteSyncOwner(serializeSuiteSyncOwner(suiteSyncOwner))).toBe(true);
    });

    it.each([
        '',
        'arbitrary plaintext',
        'null',
        '[]',
        '{}',
        JSON.stringify({ ownerId: suiteSyncOwner.ownerId }),
        JSON.stringify({ ...suiteSyncOwner, ownerSecret: 'not-hex' }),
        JSON.stringify({ ...suiteSyncOwner, ownerId: 'not-an-owner-id' }),
        JSON.stringify({ ...suiteSyncOwner, unexpected: true }),
    ])('rejects an invalid serialized Suite Sync owner', value => {
        expect(isSuiteSyncOwner(value)).toBe(false);
    });
});
