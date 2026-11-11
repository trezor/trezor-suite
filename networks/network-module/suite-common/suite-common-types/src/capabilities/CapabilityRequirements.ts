import { versionUtils } from '@trezor/utils';

import type { NetworkContext } from './NetworkContext';
import type {
    AccountType,
    BackendType,
    NetworkFeature,
    SuiteCommonNetworkConfig,
} from '../SuiteCommonNetworkConfig';

/** What a capability needs from the network config and its context in order to exist at all. */
export type CapabilityRequirements = {
    /** Read for the context's account type, which may narrow the network's own feature list. */
    readonly feature?: NetworkFeature;
    readonly backends?: readonly BackendType[];
    readonly minVersion?: string;
};

type AreRequirementsMetParams = {
    readonly requirements: CapabilityRequirements;
    readonly config: SuiteCommonNetworkConfig;
    readonly context: NetworkContext<string>;
};

/** An account type with its own feature list replaces the network's, it does not extend it. */
export const getContextFeatures = (
    config: SuiteCommonNetworkConfig,
    accountType: AccountType | undefined,
): readonly NetworkFeature[] =>
    (accountType && config.accountTypes[accountType]?.features) ?? config.features;

const isVersionAtLeast = (version: string | undefined, minVersion: string) =>
    // An unknown or malformed version cannot prove support, so it is treated as too old.
    version !== undefined &&
    versionUtils.isVersionArray(versionUtils.tryParse(version)) &&
    versionUtils.isNewerOrEqual(version, minVersion);

export const areRequirementsMet = ({
    requirements,
    config,
    context,
}: AreRequirementsMetParams): boolean => {
    if (
        requirements.feature !== undefined &&
        !getContextFeatures(config, context.accountType).includes(requirements.feature)
    ) {
        return false;
    }

    if (requirements.backends !== undefined && !requirements.backends.includes(context.backend)) {
        return false;
    }

    if (
        requirements.minVersion !== undefined &&
        !isVersionAtLeast(context.version, requirements.minVersion)
    ) {
        return false;
    }

    return true;
};
