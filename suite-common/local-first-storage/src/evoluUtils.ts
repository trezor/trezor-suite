import { OwnerId, Query, createIdFromString } from '@evolu/common';

import { EvoluKeys } from '@suite-common/suite-types';

export type UnwrapQuery<T> = T extends Query<infer U> ? U : T;

export const createOwnerIdFromEvoluKeys = (evoluKeys: EvoluKeys) =>
    OwnerId.from(createIdFromString(evoluKeys.ownerId));
