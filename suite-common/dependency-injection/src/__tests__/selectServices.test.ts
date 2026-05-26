import { selectServices } from '../useServices';

const services = {
    analytics: {
        report: jest.fn(),
    },
    suiteSync: {
        turnOffSuiteSync: jest.fn(),
    },
};

type SelectedServices = {
    analytics: typeof services.analytics;
    turnOffSuiteSync: typeof services.suiteSync.turnOffSuiteSync;
};

const selectAnalyticsDep = (currentServices: any) => ({
    analytics: currentServices.analytics,
});

const selectTurnOffSuiteSyncDep = (currentServices: any) => ({
    turnOffSuiteSync: currentServices.suiteSync.turnOffSuiteSync,
});

describe(selectServices.name, () => {
    it('selects and merges a subset of nested services', () => {
        const selectedServices: SelectedServices = selectServices(
            services,
            selectAnalyticsDep,
            selectTurnOffSuiteSyncDep,
        );

        expect(selectedServices.analytics).toBe(services.analytics);
        expect(selectedServices.turnOffSuiteSync).toBe(services.suiteSync.turnOffSuiteSync);
    });
});
