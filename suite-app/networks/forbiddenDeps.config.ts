import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@suite-app/app', '@suite-app/module-sign-verify'],
        reason: 'This registers the desktop and web network modules, used only by app code.',
    },
};
