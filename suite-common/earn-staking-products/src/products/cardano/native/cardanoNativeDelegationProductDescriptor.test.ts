import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoNativeDelegationProductDescriptor } from './cardanoNativeDelegationProductDescriptor';
import { CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS } from './cardanoNativeDelegationProductLimits';
import { everstakeProvider } from '../../../providers/everstake';
import { EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES } from '../cardanoMessageSystemFeatures';

describe('createCardanoNativeDelegationProductDescriptor', () => {
    it('builds the ada:ada:everstake:native product', () => {
        const descriptor = createCardanoNativeDelegationProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            provider: everstakeProvider,
            messageSystemFeatures: EVERSTAKE_CARDANO_MESSAGE_SYSTEM_FEATURES,
        });

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toEqual({
            id: 'ada:ada:everstake:native',
            networkSymbol: 'ada',
            asset: { kind: 'native' },
            providerId: 'everstake',
            type: 'native',
            operations: ['stake', 'unstake', 'claim', 'vote'],
            exclusivity: 'account',
            rateKind: 'apy',
            limits: CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS,
            options: [],
            consentKey: 'staking:everstake',
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'read-only' },
            },
            messageSystemFeatures: {
                stake: 'ada.staking.stake',
                unstake: 'ada.staking.unstake',
                claim: 'ada.staking.claim',
                vote: 'ada.staking.vote',
            },
            isCountedInAccountTotals: true,
        });
    });

    it('keeps the legacy limits in lovelace', () => {
        expect(CARDANO_NATIVE_DELEGATION_PRODUCT_LIMITS).toEqual({
            minStakeAmount: '0',
            maxStakeAmount: '72000000000000',
            minWithdrawalAmount: '0',
            feeBufferBalance: '0',
            minBalanceForStaking: '0',
            minStakeAmountForDashboard: '2000000',
        });
    });
});
