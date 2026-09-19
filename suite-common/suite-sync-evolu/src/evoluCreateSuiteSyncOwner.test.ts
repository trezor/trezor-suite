import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { ok } from '@trezor/type-utils';

import { evoluCreateSuiteSyncOwner } from './evoluCreateSuiteSyncOwner';

const OWNER_SECRET_HEX =
    'e17818d7c458f171885280eeef2d70078c6842b51e18ec6f2f8c9f44d3d171fd0f49a3aeff32a560d7f823321fcd24f8d8773ffa59855c6447b11af88a2fd7b5';
const TOO_SHORT_SECRET_HEX = 'deadbeefcafe';

describe(evoluCreateSuiteSyncOwner.name, () => {
    it('derives the owner from the device node', () => {
        expect(evoluCreateSuiteSyncOwner({ data: OWNER_SECRET_HEX })).toEqual(
            ok({
                ownerId: asSuiteSyncOwnerId('yg0UgROParTpm60ltI3hDw'),
                ownerSecret: asSuiteSyncOwnerSecretHex(OWNER_SECRET_HEX),
            }),
        );
    });

    it('reports a failure without the device node data', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        const result = evoluCreateSuiteSyncOwner({ data: TOO_SHORT_SECRET_HEX });

        expect(result.success).toBe(false);
        expect(!result.success && result.error.type).toBe('CreateSuiteSyncOwnerError');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Evolu: appOwnerResult error', 'OwnerSecret');
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(TOO_SHORT_SECRET_HEX);
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('222');

        consoleErrorSpy.mockRestore();
    });
});
