import type { ForbiddenDepsConfig } from '@trezor/requirements';

const reason =
    'Network packages may use shared logic and generic lego packages. Application dependencies must be injected.';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        { packageNamePattern: '^@suite/', reason },
        { packageNamePattern: '^@suite-native/', reason },
        { packageNamePattern: '^@suite-cli/', reason },
    ],
};
