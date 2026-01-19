import { DesktopLegacyAnalyticsDep, EventType } from '@suite/analytics';
import { TurnOnSuiteSync, TurnOnSuiteSyncDep } from '@suite-common/suite-sync-types';

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
    DesktopLegacyAnalyticsDep &
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

        deps.legacyAnalytics.report({
            type: EventType.SettingsGeneralLabelingProvider,
            payload: {
                provider: 'evolu',
            },
        });

        return deps.turnOnSuiteSync(params);
    };
