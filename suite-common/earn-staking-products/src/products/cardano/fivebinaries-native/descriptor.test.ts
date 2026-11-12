import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { fivebinariesProvider } from '../../../providers/fivebinaries';
import { CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES } from '../messageSystemFeatures';
import { createCardanoFivebinariesNativeProductDescriptor } from './descriptor';

describe('createCardanoFivebinariesNativeProductDescriptor', () => {
    it('builds the ada:ada:fivebinaries:native product without staking', () => {
        const descriptor = createCardanoFivebinariesNativeProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            provider: fivebinariesProvider,
            messageSystemFeatures: CARDANO_STAKING_MESSAGE_SYSTEM_FEATURES,
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
            rewardsKind: 'claimable',
            limits: {
                minStakeAmount: '0',
                maxStakeAmount: '0',
                minWithdrawalAmount: '0',
                feeBufferBalance: '0',
                minBalanceForStaking: '0',
                minStakeAmountForDashboard: '0',
                registrationDeposit: '0',
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
            minFirmware: {},
            isCountedInAccountTotals: true,
        });
    });
});
