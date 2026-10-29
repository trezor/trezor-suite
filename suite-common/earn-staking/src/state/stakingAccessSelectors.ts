import { selectIsDeviceInViewOnlyMode } from '@suite-common/device';
import type {
    StakingOperation,
    StakingProductAccess,
    StakingProductId,
} from '@suite-common/earn-staking-common';
import {
    type FeatureDomain,
    type MessageSystemRootState,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@trezor/redux-utils';

import type { StakingRootState } from './stakingReducer';
import { selectStakingPlatform, selectStakingProductDescriptor } from './stakingSelectors';

export type ResolvedStakingProductAccess = {
    access: StakingProductAccess;
    operations: readonly StakingOperation[];
};

const NO_OPERATIONS: readonly StakingOperation[] = [];

const HIDDEN: ResolvedStakingProductAccess = { access: 'hidden', operations: NO_OPERATIONS };

const READ_ONLY: ResolvedStakingProductAccess = { access: 'read-only', operations: NO_OPERATIONS };

const selectProductDescriptorParam = (state: StakingRootState, productId: StakingProductId) =>
    selectStakingProductDescriptor(state, productId);

const selectMessageSystem = (state: MessageSystemRootState) => state.messageSystem;

export const selectStakingProductAccess = createWeakMapSelector(
    [
        selectProductDescriptorParam,
        selectStakingPlatform,
        selectIsDeviceInViewOnlyMode,
        selectMessageSystem,
    ],
    (descriptor, platform, isDeviceInViewOnlyMode, messageSystem): ResolvedStakingProductAccess => {
        if (descriptor === null || platform === null) return HIDDEN;

        const support = descriptor.platforms[platform];

        if (support.access !== 'manage') {
            return { access: support.access, operations: NO_OPERATIONS };
        }

        if (isDeviceInViewOnlyMode) return READ_ONLY;

        const operations = (support.operations ?? descriptor.operations).filter(operation => {
            const feature = descriptor.messageSystemFeatures[operation];

            return (
                feature === undefined ||
                !selectIsFeatureDisabled({ messageSystem }, feature as FeatureDomain)
            );
        });

        return operations.length === 0 ? READ_ONLY : { access: 'manage', operations };
    },
);
