import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getEverstakePoolDeployment } from './deployments';
import { createEthereumEverstakePooledProductDescriptor } from './descriptor';

const createDescriptor = (symbol: string) => {
    const networkSymbol = asNetworkSymbol(symbol);

    return createEthereumEverstakePooledProductDescriptor({
        networkSymbol,
        deployment: getEverstakePoolDeployment(networkSymbol),
    });
};

describe('createEthereumEverstakePooledProductDescriptor', () => {
    it.each([
        { symbol: 'eth', id: 'eth:eth:everstake:pooled', minStakeAmount: '10000000000000000' },
        { symbol: 'thod', id: 'thod:thod:everstake:pooled', minStakeAmount: '100000000000000000' },
    ])('builds the $id product', ({ symbol, id, minStakeAmount }) => {
        const descriptor = createDescriptor(symbol);

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
            limits: { minStakeAmount, minStakeAmountForDashboard: minStakeAmount },
            options: [{ key: 'instant', kind: 'boolean' }],
            consentKey: 'staking:everstake',
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'manage' },
            },
            isCountedInAccountTotals: true,
        });
    });

    it('maps the mainnet operations onto the existing message-system keys', () => {
        expect(createDescriptor('eth').messageSystemFeatures).toEqual({
            stake: 'eth.staking.stake',
            unstake: 'eth.staking.unstake',
            withdraw: 'eth.staking.claim',
        });
    });

    it('gives Hoodi no message-system keys', () => {
        expect(createDescriptor('thod').messageSystemFeatures).toEqual({});
    });
});
