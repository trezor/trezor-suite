import { type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type TurnOnSuiteSync, type TurnOnSuiteSyncDep } from '@suite-common/suite-sync-types';

/**
 * @deprecated Compatibility layer for LegacyLabeling
 */
export type DisableLegacyMetadataIfNeeded = () => void;

/**
 * @deprecated Compatibility layer for LegacyLabeling
 */
export type DisableLegacyMetadataIfNeededDep = {
    disableLegacyMetadataIfNeeded: DisableLegacyMetadataIfNeeded;
};

type CreateTurnOnDesktopSuiteSyncDeps = TurnOnSuiteSyncDep &
    DesktopAnalyticsDep &
    DisableLegacyMetadataIfNeededDep;

/**
 * This is decorator to add a Desktop specific functionality to the "Suite Sync: Turn On"
 * operation.
 */
export const createTurnOnDesktopSuiteSync =
    (deps: CreateTurnOnDesktopSuiteSyncDeps): TurnOnSuiteSync =>
    params => {
        // Enabling Evolu implicitly disables Legacy Labeling
        deps.disableLegacyMetadataIfNeeded();

        deps.analytics.report({
            type: events.settingsGeneralLabelingProviderEvent.name,
            payload: {
                provider: 'evolu',
            },
        });

        return deps.turnOnSuiteSync(params);
    };
