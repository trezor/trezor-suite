import type { ForbiddenDepsConfig } from '@trezor/requirements';

const CONNECT_TIER_FORBIDDEN_REASON =
    'Foundational packages must not depend on connect-tier packages (would create a dependency cycle through @trezor/connect-common).';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageName: '@trezor/connect-common', reason: CONNECT_TIER_FORBIDDEN_REASON },
        { packageName: '@trezor/connect', reason: CONNECT_TIER_FORBIDDEN_REASON },
        { packageName: '@trezor/connect-web', reason: CONNECT_TIER_FORBIDDEN_REASON },
        { packageName: '@trezor/connect-webextension', reason: CONNECT_TIER_FORBIDDEN_REASON },
        { packageName: '@trezor/connect-mobile', reason: CONNECT_TIER_FORBIDDEN_REASON },
    ],
};
