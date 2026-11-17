import { type DeviceRootState, selectDeviceFirmwareVersionArray } from '@suite-common/device';
import type {
    FirmwareVersion,
    StakingOperation,
    StakingPlatform,
    StakingProductAccess,
    StakingProductDescriptor,
    StakingProductId,
} from '@suite-common/earn-staking-common';
import {
    type FeatureDomain,
    type MessageSystemRootState,
    selectFeatureMessageContent,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import type { NetworkSymbol } from '@trezor/network-module-types';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';
import { type VersionArray, versionUtils } from '@trezor/utils';

import {
    selectCountedStakingPositionEntriesByAccount,
    selectStakingAccountPositionEntry,
} from './stakingAccountSelectors';
import type { StakingRootState } from './stakingReducer';
import {
    selectStakingPlatform,
    selectStakingProductDescriptor,
    selectStakingProductDescriptors,
    selectStakingProductDescriptorsBySymbol,
} from './stakingSelectors';

export type StakingDisabledOperationReason =
    | { kind: 'message-system'; feature: string }
    | { kind: 'firmware'; minFirmware: FirmwareVersion };

export type StakingDisabledOperations = Partial<
    Record<StakingOperation, StakingDisabledOperationReason>
>;

export type ResolvedStakingProductAccess = {
    access: StakingProductAccess;
    operations: readonly StakingOperation[];
    disabled: StakingDisabledOperations;
};

export type StakingAccessRootState = StakingRootState & MessageSystemRootState & DeviceRootState;

export type StakingPromoRootState = StakingRootState & NetworksRootState;

export type StakingAccountProductRootState = StakingRootState & AccountsRootState;

const NO_OPERATIONS: readonly StakingOperation[] = [];

const NO_DISABLED_OPERATIONS: StakingDisabledOperations = {};

const HIDDEN: ResolvedStakingProductAccess = {
    access: 'hidden',
    operations: NO_OPERATIONS,
    disabled: NO_DISABLED_OPERATIONS,
};

const createStableDescriptors = weakMapMemoize(
    (...descriptors: StakingProductDescriptor[]) => descriptors,
);

// The descriptor keeps its keys as plain strings, since the contracts cannot name the message
// system; a key the message system does not know is simply never disabled.
const toFeatureDomain = (feature: string) => feature as FeatureDomain;

const selectProductDescriptorParam = (state: StakingRootState, productId: StakingProductId) =>
    selectStakingProductDescriptor(state, productId);

const selectMessageSystem = (state: MessageSystemRootState) => state.messageSystem;

const selectAreTestnetsEnabledParam = (_state: StakingRootState, areTestnetsEnabled: boolean) =>
    areTestnetsEnabled;

type GetDisabledReasonParams = {
    descriptor: StakingProductDescriptor;
    operation: StakingOperation;
    messageSystem: MessageSystemRootState['messageSystem'];
    firmware: VersionArray | null;
};

const getDisabledReason = ({
    descriptor,
    operation,
    messageSystem,
    firmware,
}: GetDisabledReasonParams): StakingDisabledOperationReason | null => {
    const feature = descriptor.messageSystemFeatures[operation];

    if (
        feature !== undefined &&
        selectIsFeatureDisabled({ messageSystem }, toFeatureDomain(feature))
    ) {
        return { kind: 'message-system', feature };
    }

    const minFirmware = descriptor.minFirmware[operation];

    if (
        minFirmware !== undefined &&
        (firmware === null || !versionUtils.isNewerOrEqual(firmware, minFirmware))
    ) {
        return { kind: 'firmware', minFirmware };
    }

    return null;
};

export const selectStakingProductAccess = createWeakMapSelector(
    [
        selectProductDescriptorParam,
        selectStakingPlatform,
        selectMessageSystem,
        selectDeviceFirmwareVersionArray,
    ],
    (descriptor, platform, messageSystem, firmware): ResolvedStakingProductAccess => {
        if (descriptor === null || platform === null) return HIDDEN;

        const support = descriptor.platforms[platform];

        if (support.access !== 'manage') {
            return {
                access: support.access,
                operations: NO_OPERATIONS,
                disabled: NO_DISABLED_OPERATIONS,
            };
        }

        const disabled: StakingDisabledOperations = {};

        const operations = (support.operations ?? descriptor.operations).filter(operation => {
            const reason = getDisabledReason({ descriptor, operation, messageSystem, firmware });

            if (reason === null) return true;

            disabled[operation] = reason;

            return false;
        });

        return { access: 'manage', operations, disabled };
    },
);

export const selectStakingOperationMessageContent = (
    state: StakingRootState & MessageSystemRootState,
    productId: StakingProductId,
    operation: StakingOperation,
    locale: string,
): string | null => {
    const feature = selectStakingProductDescriptor(state, productId)?.messageSystemFeatures[
        operation
    ];

    if (feature === undefined) return null;

    return selectFeatureMessageContent(state, toFeatureDomain(feature), locale) ?? null;
};

const isStakeableOnPlatform = (
    descriptor: StakingProductDescriptor,
    platform: StakingPlatform | null,
): boolean =>
    platform !== null &&
    descriptor.operations.includes('stake') &&
    descriptor.platforms[platform].access !== 'hidden';

export const selectStakeableStakingProductDescriptorsBySymbol = createWeakMapSelector(
    [selectStakingProductDescriptorsBySymbol, selectStakingPlatform],
    (descriptors, platform): readonly StakingProductDescriptor[] =>
        returnStableArrayIfEmpty(
            createStableDescriptors(
                ...descriptors.filter(descriptor => isStakeableOnPlatform(descriptor, platform)),
            ),
        ),
);

// The first stakeable product stands for the network until a second provider exists.
export const selectStakeableStakingProductDescriptorBySymbol = (
    state: StakingRootState,
    networkSymbol: NetworkSymbol,
): StakingProductDescriptor | null =>
    selectStakeableStakingProductDescriptorsBySymbol(state, networkSymbol)[0] ?? null;

export const selectIsStakingManageableSymbol = (
    state: StakingAccessRootState,
    networkSymbol: NetworkSymbol,
): boolean => {
    const descriptor = selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol);

    return (
        descriptor !== null && selectStakingProductAccess(state, descriptor.id).access === 'manage'
    );
};

export const selectStakingAccountProductDescriptor = (
    state: StakingAccountProductRootState,
    accountKey: AccountKey,
): StakingProductDescriptor | null => {
    const entry = selectStakingAccountPositionEntry(state, accountKey);

    if (entry !== null) {
        return entry.descriptor;
    }

    const account = selectAccountByKey(state, accountKey);

    if (!account) {
        return null;
    }

    return selectStakeableStakingProductDescriptorBySymbol(state, account.symbol);
};

// Staked with an operator Suite does not offer: the position's product takes no new stake here.
export const selectIsStakingAccountDelegatedOutside = (
    state: StakingRootState,
    accountKey: AccountKey,
): boolean => {
    const platform = selectStakingPlatform(state);

    return selectCountedStakingPositionEntriesByAccount(state, accountKey).some(
        ({ descriptor }) => !isStakeableOnPlatform(descriptor, platform),
    );
};

export const selectStakingPromoProductDescriptors = createWeakMapSelector(
    [
        selectStakingProductDescriptors,
        selectStakingPlatform,
        selectSupportedNetworkSymbols,
        selectAreTestnetsEnabledParam,
    ],
    (
        descriptors,
        platform,
        supportedNetworkSymbols,
        areTestnetsEnabled,
    ): readonly StakingProductDescriptor[] =>
        returnStableArrayIfEmpty(
            createStableDescriptors(
                ...descriptors
                    .filter(
                        descriptor =>
                            isStakeableOnPlatform(descriptor, platform) &&
                            (areTestnetsEnabled || !isTestnet(descriptor.networkSymbol)),
                    )
                    .toSorted(
                        (a, b) =>
                            supportedNetworkSymbols.indexOf(a.networkSymbol) -
                            supportedNetworkSymbols.indexOf(b.networkSymbol),
                    ),
            ),
        ),
);
