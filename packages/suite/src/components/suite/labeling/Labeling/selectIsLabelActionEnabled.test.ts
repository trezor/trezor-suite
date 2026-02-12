import { mocked } from 'jest-mock';

import { deviceReducerInitialState } from '@suite-common/device';
import {
    SuiteSyncState,
    type WithSuiteSyncAndDeviceState,
    initialSuiteSyncState,
} from '@suite-common/suite-sync';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { StaticSessionId, UnavailableCapabilities } from '@trezor/connect';

import { selectIsLabelActionEnabled } from './selectIsLabelActionEnabled';
import {
    MetadataRootState,
    initialMetadataState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '../../../../reducers/suite/metadataReducer';
import { SuiteRootState, suiteInitialState } from '../../../../reducers/suite/suiteReducer';

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
    deviceOverrides: Parameters<typeof mockSuiteDevice>[0] = {},
    suiteSyncOverrides: Partial<SuiteSyncState> = {},
    isSuiteSyncFeatureEnabled = false,
) =>
    ({
        device: {
            ...deviceReducerInitialState,
            devices: [
                mockSuiteDevice({
                    ...deviceOverrides,
                    state: { staticSessionId: DEVICE_STATIC_SESSION_ID_123 },
                }),
            ],
        },
        suiteSync: {
            ...initialSuiteSyncState,
            ...suiteSyncOverrides,
        },
        suite: {
            ...suiteInitialState,
            settings: {
                ...suiteInitialState.settings,
                experimental: isSuiteSyncFeatureEnabled ? ['suite-sync'] : undefined,
            },
        },
        wallet: {
            accounts: [] as any[],
        },
        metadata: {
            ...initialMetadataState,
        },
        // This HARD CAST is here because MetadataRootState is HUGE,
        // and I do not want to refactor Legacy Labeling
    }) as WithSuiteSyncAndDeviceState & MetadataRootState & SuiteRootState;

describe(selectIsLabelActionEnabled.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testLabelActionEnabled = ({
        unavailableCapabilities,
        isSuiteSyncFeatureEnabled,
    }: {
        unavailableCapabilities: UnavailableCapabilities;
        isSuiteSyncFeatureEnabled: boolean;
    }) => {
        const state = createMockState({ unavailableCapabilities }, {}, isSuiteSyncFeatureEnabled);

        return selectIsLabelActionEnabled(state, DEVICE_STATIC_SESSION_ID_123, 'address-123');
    };

    it('allows labeling despite update-needed for Suite Sync', () => {
        const result = testLabelActionEnabled({
            unavailableCapabilities: { evolu: 'update-required' },
            isSuiteSyncFeatureEnabled: true,
        });

        expect(result).toBe(true);
    });

    it('disables labeling for unsupported device', () => {
        const result = testLabelActionEnabled({
            unavailableCapabilities: { evolu: 'no-capability' },
            isSuiteSyncFeatureEnabled: true,
        });

        expect(result).toBe(false);
    });

    it('disables labeling as Suite Sync is not available and legacy labeling is not possible', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(false);
        mocked(selectIsLabelingInitPossible).mockReturnValue(false);

        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: false,
        });

        expect(result).toBe(false);
    });

    it('allows labeling when legacy labeling is enabled (Suite Sync not available)', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(true);
        mocked(selectIsLabelingInitPossible).mockReturnValue(false);

        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: false,
        });

        expect(result).toBe(true);
    });

    it('allows labeling when legacy labeling init is possible (Suite Sync not available)', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(true);
        mocked(selectIsLabelingInitPossible).mockReturnValue(true);

        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: false,
        });

        expect(result).toBe(true);
    });
});
