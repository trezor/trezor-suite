import { CreateSuiteSyncOwner, CreateSuiteSyncOwnerError } from '@suite-common/suite-sync-storage';
import { asSuiteSyncOwnerId, asSuiteSyncOwnerSecretHex } from '@suite-common/suite-types';
import { err, ok } from '@trezor/type-utils';

/**
 * Creates Suite Sync owner from Trezor device data.
 * The owner secret will be used to derive Jazz account credentials.
 */
export const jazzCreateSuiteSyncOwner: CreateSuiteSyncOwner = ({ data }) => {
    if (!data) {
        return err(CreateSuiteSyncOwnerError('Device state is required for Suite Sync'));
    }

    try {
        // Use the data as owner ID (similar to evolu)
        // The data will be used as the seed for Jazz account creation
        return ok({
            ownerId: asSuiteSyncOwnerId(data),
            ownerSecret: asSuiteSyncOwnerSecretHex(data),
        });
    } catch (error) {
        return err(
            CreateSuiteSyncOwnerError(
                `Failed to create Jazz owner: ${error instanceof Error ? error.message : String(error)}`,
            ),
        );
    }
};
