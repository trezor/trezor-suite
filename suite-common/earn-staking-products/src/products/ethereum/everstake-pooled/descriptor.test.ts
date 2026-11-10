import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEverstakePooledProductDescriptor } from './descriptor';
import { EVERSTAKE_POOLED_PRODUCT_LIMITS } from './limits';

describe('createEverstakePooledProductDescriptor', () => {
    it.each([
        { symbol: 'eth', id: 'eth:eth:everstake:pooled' },
        { symbol: 'thod', id: 'thod:thod:everstake:pooled' },
    ])('builds the $id product', ({ symbol, id }) => {
        const descriptor = createEverstakePooledProductDescriptor(asNetworkSymbol(symbol));

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toMatchObject({
            id,
            networkSymbol: symbol,
            asset: { kind: 'native' },
            providerId: 'everstake',
            type: 'pooled',
            operations: ['stake', 'unstake', 'withdraw'],
            exclusivity: 'none',
            rateKind: 'apy',
            limits: EVERSTAKE_POOLED_PRODUCT_LIMITS,
            options: [{ key: 'instant', kind: 'boolean' }],
            consentKey: 'staking:everstake',
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'manage' },
            },
            isCountedInAccountTotals: true,
        });
    });

    it('keeps the legacy limits in wei', () => {
        expect(EVERSTAKE_POOLED_PRODUCT_LIMITS).toEqual({
            minStakeAmount: '10000000000000000',
            maxStakeAmount: '1000000000000000000000000',
            minWithdrawalAmount: '5000000000000000',
            feeBufferBalance: '5000000000000000',
            minBalanceForStaking: '15000000000000000',
            minStakeAmountForDashboard: '10000000000000000',
        });
    });

    it('maps the mainnet operations onto the existing message-system keys', () => {
        expect(
            createEverstakePooledProductDescriptor(asNetworkSymbol('eth')).messageSystemFeatures,
        ).toEqual({
            stake: 'eth.staking.stake',
            unstake: 'eth.staking.unstake',
            withdraw: 'eth.staking.claim',
        });
    });

    it('gives Hoodi no message-system keys', () => {
        expect(
            createEverstakePooledProductDescriptor(asNetworkSymbol('thod')).messageSystemFeatures,
        ).toEqual({});
    });
});
