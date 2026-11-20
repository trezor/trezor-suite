import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'allowed-only-in': {
        packages: ['@suite-app/app', '@suite-app/web-app', '@suite-app/desktop-app-renderer'],
        reason: 'This is an app section module, imported only by app assembly.',
    },
};
