import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createTronCuratedProductDescriptor } from './descriptor';
import { TRON_CURATED_PRODUCT_LIMITS } from './limits';
import { TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './messageSystemFeatures';

describe('createTronCuratedProductDescriptor', () => {
    it('builds the trx:trx:curated:native product', () => {
        const descriptor = createTronCuratedProductDescriptor({
            networkSymbol: asNetworkSymbol('trx'),
            messageSystemFeatures: TRON_CURATED_PRODUCT_MESSAGE_SYSTEM_FEATURES,
        });

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toEqual({
            id: 'trx:trx:curated:native',
            networkSymbol: 'trx',
            asset: { kind: 'native' },
            providerId: 'curated',
            type: 'native',
            operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
            exclusivity: 'none',
            rateKind: 'apr',
            limits: TRON_CURATED_PRODUCT_LIMITS,
            options: [{ key: 'resource', kind: 'choice' }],
            consentKey: 'staking:curated',
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'read-only' },
            },
            messageSystemFeatures: {
                stake: 'trx.staking.stake',
                unstake: 'trx.staking.unstake',
                withdraw: 'trx.staking.withdraw',
                claim: 'trx.staking.claim',
                vote: 'trx.staking.vote',
            },
            isCountedInAccountTotals: true,
        });
    });

    it('keeps the legacy limits in sun', () => {
        expect(TRON_CURATED_PRODUCT_LIMITS).toEqual({
            minStakeAmount: '1000000',
            maxStakeAmount: '1000000000000000',
            minWithdrawalAmount: '10000',
            feeBufferBalance: '5000000',
            minBalanceForStaking: '1010000',
            minStakeAmountForDashboard: '1000000',
        });
    });
});
