import type { ForbiddenDepsConfig } from '@trezor/requirements';

/** The desktop and web layer: `network-<family>-suite` modules and their contract. */
const suiteLayerPattern = '^@trezor/network-(?:[a-z0-9]+-suite|module-suite-types)$';

const appReason =
    'Network packages sit below the apps. Take anything an app owns as an injected dependency instead.';

const suiteReason =
    'Only the Suite layer (network-<family>-suite and its contract) may use desktop and web lego. ' +
    'Take anything else an app owns as an injected dependency instead.';

const suiteCommonReason =
    'Only the Suite layer may use shared lego for now. @suite-common/networks composes the Suite ' +
    'Common network modules, so a network-<family>-suite-common package depending on ' +
    '@suite-common/* would create a dependency cycle.';

const suiteNativeReason =
    'No Suite Native network layer exists yet. Add it to this policy together with its first package.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePattern: '^@suite-app/', reason: appReason },
        { packageNamePattern: '^@suite-native-app/', reason: appReason },
        { packageNamePattern: '^@trezor/suite$', reason: appReason },
        {
            packageNamePattern: '^@suite/',
            allowedInPattern: suiteLayerPattern,
            reason: suiteReason,
        },
        {
            packageNamePattern: '^@suite-common/',
            allowedInPattern: suiteLayerPattern,
            reason: suiteCommonReason,
        },
        { packageNamePattern: '^@suite-native/', reason: suiteNativeReason },
    ],
};
