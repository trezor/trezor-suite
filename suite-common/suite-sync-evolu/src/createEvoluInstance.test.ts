import { type Run } from '@evolu/common';
import { type EvoluPlatformDeps } from '@evolu/common/local-first';

import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';

import { createEvoluInstanceFactory } from './createEvoluInstance';

const TOO_SHORT_SECRET_HEX = 'deadbeefcafe';

describe(createEvoluInstanceFactory.name, () => {
    it('rejects an invalid owner secret without exposing it', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const run = jest.fn();

        const promise = createEvoluInstanceFactory({
            run: run as unknown as Run<EvoluPlatformDeps>,
        })({
            suiteSyncOwner: {
                ownerId: asSuiteSyncOwnerId('owner-id'),
                ownerSecret: asSuiteSyncOwnerSecretHex(TOO_SHORT_SECRET_HEX),
            },
        });

        await expect(promise).rejects.toThrow('OwnerSecret');
        await expect(promise).rejects.not.toThrow(TOO_SHORT_SECRET_HEX);
        await expect(promise).rejects.not.toThrow('222');
        expect(run).not.toHaveBeenCalled();
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain(TOO_SHORT_SECRET_HEX);
        expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('222');

        consoleErrorSpy.mockRestore();
    });
});
