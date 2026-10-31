import type { ForbiddenDepsConfig } from '@trezor/requirements';

export const forbiddenDepsConfig: ForbiddenDepsConfig = {
    'forbidden-deps': [
        {
            packageNamePattern: '^@suite-common/earn-staking',
            except: ['@suite-common/earn-staking-api'],
            reason: 'The staking packages depend on wallet-core, so wallet-core must not depend on them. Only the generated staking API client is still used here.',
        },
    ],
};
