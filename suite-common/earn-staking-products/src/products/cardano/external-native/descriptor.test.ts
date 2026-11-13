import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES } from '../messageSystemFeatures';
import { createCardanoExternalNativeProductDescriptor } from './descriptor';

describe('createCardanoExternalNativeProductDescriptor', () => {
    it('builds the ada:ada:external:native product without staking', () => {
        const descriptor = createCardanoExternalNativeProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
        });

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toEqual({
            id: 'ada:ada:external:native',
            networkSymbol: 'ada',
            asset: { kind: 'native' },
            providerId: 'external',
            type: 'native',
            operations: ['unstake', 'claim', 'vote'],
            exclusivity: 'account',
            rateKind: 'apy',
            limits: {
                minStakeAmount: '0',
                maxStakeAmount: '0',
                minWithdrawalAmount: '0',
                feeBufferBalance: '0',
                minBalanceForStaking: '0',
                minStakeAmountForDashboard: '0',
            },
            options: [],
            consentKey: null,
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'read-only' },
            },
            messageSystemFeatures: {
                unstake: 'ada.staking.unstake',
                claim: 'ada.staking.claim',
                vote: 'ada.staking.vote',
            },
            isCountedInAccountTotals: true,
        });
    });
});
