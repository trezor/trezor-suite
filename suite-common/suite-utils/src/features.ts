import { FLAGS, FLAGS_WEB, FLAGS_DESKTOP, FeatureFlags } from '@suite-common/suite-config';

const getFlagsForEnv = (env?: string) => {
    switch (env) {
        case 'web':
            return FLAGS_WEB;
        case 'desktop':
            return FLAGS_DESKTOP;
        default:
            return FLAGS;
    }
};

/**
 * Check whether feature flag is enabled or not
 * @param flag {string} Feature flag to check.
 * @param env {string} Optional parameter to specify different environment than `process.env.SUITE_TYPE`
 * @returns {boolean} True if enabled, false if not
 */
export const isFeatureFlagEnabled = (flag: FeatureFlags, env?: string) => {
    const flags = getFlagsForEnv(env ?? process.env.SUITE_TYPE);

    return flags[flag] ?? false;
};
