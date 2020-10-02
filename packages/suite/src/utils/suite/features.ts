import {
    FLAGS,
    FLAGS_WEB,
    FLAGS_DESKTOP,
    FLAGS_LANDING,
    FeatureFlags,
} from '@suite-config/features';

const getFlagsForEnv = (env?: string) => {
    switch (env) {
        case 'web':
            return FLAGS_WEB;
        case 'desktop':
            return FLAGS_DESKTOP;
        case 'landing':
            return FLAGS_LANDING;
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
export const isEnabled = (flag: FeatureFlags, env?: string) => {
    const flags = getFlagsForEnv(env ?? process.env.SUITE_TYPE);
    return flags[flag] ?? false;
};
