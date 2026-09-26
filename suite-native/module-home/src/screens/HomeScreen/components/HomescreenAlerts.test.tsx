import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { HomescreenAlerts } from './HomescreenAlerts';

const mockFeatureFeedbackAlert = jest.fn();

jest.mock('@suite-common/suite-sync-quota-manager', () => ({
    selectShouldDisplayOutOfQuotaAlert: () => false,
}));

jest.mock('../homescreenSelectors', () => ({
    selectShouldDisplaySuiteSyncAlert: () => false,
    selectShouldDisplaySuiteSyncFirmwareUpdateAlert: () => false,
    selectShouldDisplayUpgradeFirmwareAlert: () => false,
}));

jest.mock('@suite-native/feature-feedback', () => ({
    FeatureFeedbackAlert: (props: Record<string, unknown>) => {
        mockFeatureFeedbackAlert(props);

        return null;
    },
}));

jest.mock('./SuiteSyncKeysAlert', () => ({ SuiteSyncKeysAlert: () => null }));
jest.mock('./FirmwareUpdateAlert', () => ({ FirmwareUpdateAlert: () => null }));
jest.mock('./OutOfQuotaAlert', () => ({ OutOfQuotaAlert: () => null }));
jest.mock('./SuiteSyncFirmwareUpdateAlert', () => ({ SuiteSyncFirmwareUpdateAlert: () => null }));

const renderWithPendingFeature = (pendingFeature: string) =>
    renderWithStoreProvider(<HomescreenAlerts />, {
        preloadedState: {
            featureFeedback: { pendingFeedbackFeatures: [pendingFeature] },
        },
    });

describe('HomescreenAlerts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the feedback alert for a known feature', async () => {
        await renderWithPendingFeature('suite-sync');

        expect(mockFeatureFeedbackAlert).toHaveBeenCalledWith(
            expect.objectContaining({
                pendingFeature: 'suite-sync',
                featureTitleKey: 'moduleSettings.advanced.experimentalFeatures.suiteSync.title',
            }),
        );
    });

    it('renders nothing for a persisted feature that has no feedback config', async () => {
        await renderWithPendingFeature('feature-removed-in-another-build');

        expect(mockFeatureFeedbackAlert).not.toHaveBeenCalled();
    });
});
