import { mocked } from 'jest-mock';

import {
    type MetadataRootState,
    initialMetadataState,
    selectIsLabelingAvailableForEntity,
    selectIsLabelingInitPossible,
} from '@suite/metadata';
import { type SuiteSettingsRootState, suiteSettingsInitialState } from '@suite/settings';
import { deviceReducerInitialState } from '@suite-common/device';
import {
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { Feature } from '@suite-common/message-system';
import { type SuiteSyncState, type WithSuiteSyncAndDeviceState } from '@suite-common/suite-sync';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { type StaticSessionId, type UnavailableCapabilities } from '@trezor/connect';

import {
    type DesktopSuiteSyncRootState,
    initialSuiteSyncDesktopState,
} from 'src/actions/suiteSync/suiteSyncSlice';
import { type SuiteRootState, suiteInitialState } from 'src/reducers/suite/suiteReducer';

import { selectIsLabelActionEnabled } from './selectIsLabelActionEnabled';

/**
 * It was really hard to mock the state for metadata. So I statically mocked
 * selectors. It's not nice, but as we plan to sunset legacy labeling
 * I don't want to spend time with testng the implementation details of it.
 */
jest.mock('@suite/metadata', () => ({
    selectIsLabelingAvailableForEntity: jest.fn(),
    selectIsLabelingInitPossible: jest.fn(),
    selectIsMetadataEnabled: jest.fn().mockReturnValue(false),
}));

const DEVICE_STATIC_SESSION_ID_123: StaticSessionId = '1@2:3';

const SUITE_SYNC_FEATURE_TOGGLE_MESSAGE_ID = 'test-toggle-suite-sync';

const createMessageSystemState = (isSuiteSyncFeatureAvailable: boolean) => {
    if (isSuiteSyncFeatureAvailable) {
        return messageSystemInitialState;
    }

    return {
        ...messageSystemInitialState,
        validMessages: {
            ...messageSystemInitialState.validMessages,
            feature: [SUITE_SYNC_FEATURE_TOGGLE_MESSAGE_ID],
        },
        config: {
            version: 1,
            sequence: 1,
            timestamp: '2020-01-01T00:00:00.000Z',
            actions: [
                {
                    conditions: [
                        {
                            duration: {
                                from: '2020-01-01T00:00:00.000Z',
                                to: '2030-01-01T00:00:00.000Z',
                            },
                        },
                    ],
                    message: {
                        id: SUITE_SYNC_FEATURE_TOGGLE_MESSAGE_ID,
                        category: 'feature',
                        priority: 1,
                        dismissible: true,
                        variant: 'info',
                        content: { en: 't', es: 't', cs: 't', de: 't', fr: 't', pt: 't' },
                        feature: [{ domain: Feature.suiteSync, flag: false }],
                    },
                },
            ],
        },
    };
};

const createMockState = (
    deviceOverrides: Parameters<typeof mockSuiteDevice>[0] = {},
    suiteSyncOverrides: Partial<SuiteSyncState> = {},
    isSuiteSyncFeatureAvailable = false,
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
            ...initialSuiteSyncDesktopState,
            ...suiteSyncOverrides,
        },
        suiteSettings: {
            ...suiteSettingsInitialState,
        },
        suite: suiteInitialState,
        wallet: {
            accounts: [] as any[],
        },
        metadata: {
            ...initialMetadataState,
        },
        messageSystem: createMessageSystemState(isSuiteSyncFeatureAvailable),
        // This HARD CAST is here because MetadataRootState is HUGE,
        // and I do not want to refactor Legacy Labeling
    }) as WithSuiteSyncAndDeviceState &
        MetadataRootState &
        SuiteRootState &
        SuiteSettingsRootState &
        DesktopSuiteSyncRootState &
        MessageSystemRootState;

describe(selectIsLabelActionEnabled.name, () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testLabelActionEnabled = ({
        deviceOverrides,
        unavailableCapabilities,
        isSuiteSyncFeatureEnabled,
        isSuiteSyncEnabled = false,
    }: {
        deviceOverrides?: Parameters<typeof mockSuiteDevice>[0];
        unavailableCapabilities: UnavailableCapabilities;
        isSuiteSyncFeatureEnabled: boolean;
        isSuiteSyncEnabled?: boolean;
    }) => {
        const state = createMockState(
            { unavailableCapabilities, ...deviceOverrides },
            {
                settings: {
                    ...initialSuiteSyncDesktopState.settings,
                    isSuiteSyncEnabled,
                },
            },
            isSuiteSyncFeatureEnabled,
        );

        return selectIsLabelActionEnabled(state, DEVICE_STATIC_SESSION_ID_123, 'address-123');
    };

    it('allows labeling despite update-needed for Suite Sync', () => {
        const result = testLabelActionEnabled({
            unavailableCapabilities: { evolu: 'update-required' },
            isSuiteSyncFeatureEnabled: true,
            isSuiteSyncEnabled: true,
        });

        expect(result).toBe(true);
    });

    it('allows labeling when Suite Sync is enabled and device is connected but keys are needed', () => {
        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: true,
            isSuiteSyncEnabled: true,
            deviceOverrides: {
                connected: true,
                available: true,
                remember: true,
            },
        });

        expect(result).toBe(true);
    });

    it('disables labeling when Suite Sync is enabled and remembered device is disconnected', () => {
        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: true,
            isSuiteSyncEnabled: true,
            deviceOverrides: {
                connected: false,
                available: false,
                remember: true,
            },
        });

        expect(result).toBe(false);
    });

    it('disables labeling for unsupported device', () => {
        const result = testLabelActionEnabled({
            unavailableCapabilities: { evolu: 'no-capability' },
            isSuiteSyncFeatureEnabled: true,
            isSuiteSyncEnabled: true,
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

    it('falls back to legacy labeling when Suite Sync feature is available but disabled', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(true);
        mocked(selectIsLabelingInitPossible).mockReturnValue(false);

        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: true,
        });

        expect(result).toBe(true);
    });

    it('allows labeling when Suite Sync feature is available, disabled, and can be initialized', () => {
        mocked(selectIsLabelingAvailableForEntity).mockReturnValue(false);
        mocked(selectIsLabelingInitPossible).mockReturnValue(false);

        const result = testLabelActionEnabled({
            unavailableCapabilities: {},
            isSuiteSyncFeatureEnabled: false,
            deviceOverrides: {
                connected: true,
            },
        });

        expect(result).toBe(true);
    });
});
