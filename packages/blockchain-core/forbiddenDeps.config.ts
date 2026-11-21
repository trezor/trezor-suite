import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@trezor/connect(-core)?$',
            reason: 'Blockchain backends live next to Connect, independent of its device logic.',
        },
    ],
};
