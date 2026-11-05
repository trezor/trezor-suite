import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createCardanoRetiredDelegationProductDescriptor } from './cardanoRetiredDelegationProductDescriptor';
import { fivebinariesProvider } from '../../../providers/fivebinaries';
import { CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES } from '../cardanoMessageSystemFeatures';

describe('createCardanoRetiredDelegationProductDescriptor', () => {
    it('builds the ada:ada:fivebinaries:native product without staking', () => {
        const descriptor = createCardanoRetiredDelegationProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            provider: fivebinariesProvider,
            messageSystemFeatures: CARDANO_STAKE_KEY_MESSAGE_SYSTEM_FEATURES,
        });

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toEqual({
            id: 'ada:ada:fivebinaries:native',
            networkSymbol: 'ada',
            asset: { kind: 'native' },
            providerId: 'fivebinaries',
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
