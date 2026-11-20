import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'Network packages may use lego (@suite/*, @suite-common/*, @suite-native/*), but not app code. ' +
    'Take anything an app owns as an injected dependency instead.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePattern: '^@suite-app/', reason },
        { packageNamePattern: '^@suite-native-app/', reason },
        { packageNamePattern: '^@trezor/suite$', reason },
    ],
};
