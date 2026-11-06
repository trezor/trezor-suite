import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@suite-app/app', '@suite-native/state'],
        reason: 'The global dependency graph may be imported only by web, desktop and Native application wiring.',
    },
};
