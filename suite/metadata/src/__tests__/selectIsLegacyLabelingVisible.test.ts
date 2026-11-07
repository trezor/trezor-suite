import { deviceReducerInitialState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type SuiteSyncState, initialSuiteSyncState } from '@suite-common/suite-sync';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId, type UnavailableCapabilities } from '@trezor/connect';

import { initialMetadataState } from '../metadataReducer';
import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
} from '../selectIsLegacyLabelingVisible';

const DEVICE_STATIC_SESSION_ID: StaticSessionId = '1@2:3';

const createMockState = ({
    isMetadataEnabled,
    isSuiteSyncEnabled,
    unavailableCapabilities,
}: {
    isMetadataEnabled: boolean;
    isSuiteSyncEnabled: boolean;
    unavailableCapabilities: UnavailableCapabilities;
}) => {
    const device = mockSuiteDevice({
        unavailableCapabilities,
        state: { staticSessionId: DEVICE_STATIC_SESSION_ID },
    });

    return {
        device: {
            ...deviceReducerInitialState,
            devices: [device],
            selectedDevice: device,
        },
        suiteSync: {
            ...initialSuiteSyncState,
            settings: {
                ...initialSuiteSyncState.settings,
                isSuiteSyncEnabled,
            },
        } as SuiteSyncState,
        metadata: {
            ...initialMetadataState,
            enabled: isMetadataEnabled,
        },
        messageSystem: messageSystemInitialState,
    } as LegacyLabelingVisibleRootState;
};

describe(selectIsLegacyLabelingVisible.name, () => {
    it('is not visible when legacy metadata is disabled', () => {
        const state = createMockState({
            isMetadataEnabled: false,
            isSuiteSyncEnabled: false,
            unavailableCapabilities: {},
        });

        expect(selectIsLegacyLabelingVisible(state)).toBe(false);
    });

    it('is visible when legacy metadata is enabled and Suite Sync is disabled', () => {
        const state = createMockState({
            isMetadataEnabled: true,
            isSuiteSyncEnabled: false,
            unavailableCapabilities: {},
        });

        expect(selectIsLegacyLabelingVisible(state)).toBe(true);
    });

    it('is not visible when Suite Sync is enabled and the device supports Suite Sync', () => {
        const state = createMockState({
            isMetadataEnabled: true,
            isSuiteSyncEnabled: true,
            unavailableCapabilities: {},
        });

        expect(selectIsLegacyLabelingVisible(state)).toBe(false);
    });

    it('stays visible when Suite Sync is enabled but the device only needs a firmware upgrade', () => {
        const state = createMockState({
            isMetadataEnabled: true,
            isSuiteSyncEnabled: true,
            unavailableCapabilities: { evolu: 'update-required' },
        });

        // update-required devices are still considered Suite Sync supported, so legacy labels hide.
        expect(selectIsLegacyLabelingVisible(state)).toBe(false);
    });

    it('is visible (read-only) on an old Trezor without Suite Sync support even when Suite Sync is enabled', () => {
        const state = createMockState({
            isMetadataEnabled: true,
            isSuiteSyncEnabled: true,
            unavailableCapabilities: { evolu: 'no-capability' },
        });

        expect(selectIsLegacyLabelingVisible(state)).toBe(true);
    });
});
