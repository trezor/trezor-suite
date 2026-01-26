import { mocked } from 'jest-mock';

import {
    SuiteSyncState,
    type WithSuiteSyncAndDeviceState,
    initialSuiteSyncState,
} from '@suite-common/suite-sync';
import { getSuiteDevice } from '@suite-common/test-utils';
import { deviceReducerInitialState } from '@suite-common/wallet-core';
import { StaticSessionId, UnavailableCapabilities } from '@trezor/connect';

import { selectIsLabelActionEnabled } from './selectIsLabelActionEnabled';
import { DesktopSuiteSyncState } from '../../../../actions/suiteSync/suiteSyncSlice';
import {
    MetadataRootState,
    initialMetadataState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '../../../../reducers/suite/metadataReducer';

/**
 * It was really hard to mock the state for metadata. So I statically mocked
 * selectors. It's not nice, but as we plan to sunset legacy labeling
 * I don't want to spend time with testng the implementation details of it.
 */
jest.mock('../../../../reducers/suite/metadataReducer', () => ({
    selectIsLabelingAvailableForEntity: jest.fn(),
    selectIsLabelingInitPossible: jest.fn(),
}));

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const createMockState = (
    deviceOverrides: Parameters<typeof getSuiteDevice>[0] = {},
    suiteSyncOverrides: Partial<SuiteSyncState> = {},
) =>
    ({
        device: {
            ...deviceReducerInitialState,
            devices: [getSuiteDevice({ ...deviceOverrides, state: DEVICE_STATIC_SESSION_ID_123 })],
        },
        suiteSync: {
            ...initialSuiteSyncState,
            ...suiteSyncOverrides,
        },
        wallet: {
            accounts: [] as any[],
        },
        metadata: {
            ...initialMetadataState,
        },
        // This HARD CAST is here because MetadataRootState is HUGE,
        // and I do not want to refactor Legacy Labeling
    }) as WithSuiteSyncAndDeviceState & MetadataRootState;

describe(selectIsLabelActionEnabled.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testLabelActionEnabled = (
        unavailableCapabilities: UnavailableCapabilities,
        suiteSyncSettings: Partial<DesktopSuiteSyncState['settings']>,
    ) => {
        const state = createMockState(
            { unavailableCapabilities },
            { settings: { ...initialSuiteSyncState.settings, ...suiteSyncSettings } },
        );

        return selectIsLabelActionEnabled(state, DEVICE_STATIC_SESSION_ID_123, 'address-123');
    };

    it('allows labeling despite update-needed for Suite Sync', () => {
        const result = testLabelActionEnabled(
            { evolu: 'update-required' },
            { isFeatureSuiteSyncAvailable: true },
        );

        expect(result).toBe(true);
    });

    it('disables labeling for unsupported device', () => {
        const result = testLabelActionEnabled(
            { evolu: 'no-capability' },
            { isFeatureSuiteSyncAvailable: true },
        );

        expect(result).toBe(false);
    });

    it('disables labeling as Suite Sync is not available and legacy labeling is not possible', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(false);
        mocked(selectIsLabelingInitPossible).mockReturnValue(false);

        const result = testLabelActionEnabled({}, { isFeatureSuiteSyncAvailable: false });

        expect(result).toBe(false);
    });

    it('allows labeling when legacy labeling is enabled (Suite Sync not available)', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(true);
        mocked(selectIsLabelingInitPossible).mockReturnValue(false);

        const result = testLabelActionEnabled({}, { isFeatureSuiteSyncAvailable: false });

        expect(result).toBe(true);
    });

    it('allows labeling when legacy labeling init is possible (Suite Sync not available)', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(true);
        mocked(selectIsLabelingInitPossible).mockReturnValue(true);

        const result = testLabelActionEnabled({}, { isFeatureSuiteSyncAvailable: false });

        expect(result).toBe(true);
    });
});
