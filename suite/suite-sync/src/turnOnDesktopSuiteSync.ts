import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type TurnOnSuiteSync, type TurnOnSuiteSyncDep } from '@suite-common/suite-sync-types';

type CreateTurnOnDesktopSuiteSyncDeps = TurnOnSuiteSyncDep & DesktopAnalyticsDep;

/**
 * This is decorator to add a Desktop specific functionality to the "Suite Sync: Turn On"
 * operation.
 */
export const createTurnOnDesktopSuiteSync =
    (deps: CreateTurnOnDesktopSuiteSyncDeps): TurnOnSuiteSync =>
    params => {
        deps.analytics.report({
            type: events.settingsGeneralLabelingProviderEvent.name,
            payload: {
                provider: 'evolu',
            },
        });

        return deps.turnOnSuiteSync(params);
    };
