import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePrefix: '@suite-common/',
            reason:
                'Redux utilities are domain-independent infrastructure. Depending on a Suite ' +
                'Common business package would reintroduce application contracts and dependency ' +
                'cycles into this foundation package.',
        },
    ],
};
