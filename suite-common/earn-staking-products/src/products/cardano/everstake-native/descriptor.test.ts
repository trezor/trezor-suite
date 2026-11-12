import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { everstakeProvider } from '../../../providers/everstake';
import { CARDANO_EVERSTAKE_NATIVE_MESSAGE_SYSTEM_FEATURES } from '../messageSystemFeatures';
import { createCardanoEverstakeNativeProductDescriptor } from './descriptor';
import { CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';

describe('createCardanoEverstakeNativeProductDescriptor', () => {
    it('builds the ada:ada:everstake:native product', () => {
        const descriptor = createCardanoEverstakeNativeProductDescriptor({
            networkSymbol: asNetworkSymbol('ada'),
            provider: everstakeProvider,
            messageSystemFeatures: CARDANO_EVERSTAKE_NATIVE_MESSAGE_SYSTEM_FEATURES,
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
            rewardsKind: 'claimable',
            limits: CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS,
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
            minFirmware: {},
            isCountedInAccountTotals: true,
        });
    });

    it('keeps the legacy limits in lovelace', () => {
        expect(CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS).toEqual({
            minStakeAmount: '0',
            maxStakeAmount: '72000000000000',
            minWithdrawalAmount: '0',
            feeBufferBalance: '0',
            minBalanceForStaking: '0',
            minStakeAmountForDashboard: '2000000',
            registrationDeposit: '2000000',
        });
    });
});
