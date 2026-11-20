import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaEverstakeNativeProductDescriptor } from './descriptor';
import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS } from './limits';
import { SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES } from './messageSystemFeatures';
import { everstakeProvider } from '../../../providers/everstake';

describe('createSolanaNativeDelegationDescriptor', () => {
    it.each([
        { symbol: 'sol', id: 'sol:sol:everstake:native' },
        { symbol: 'dsol', id: 'dsol:dsol:everstake:native' },
    ])('builds the $id product', ({ symbol, id }) => {
        const descriptor = createSolanaEverstakeNativeProductDescriptor({
            networkSymbol: asNetworkSymbol(symbol),
            provider: everstakeProvider,
            messageSystemFeatures: {},
        });

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toEqual({
            id,
            networkSymbol: symbol,
            asset: { kind: 'native' },
            providerId: 'everstake',
            type: 'native',
            operations: ['stake', 'unstake', 'withdraw'],
            exclusivity: 'none',
            rateKind: 'apy',
            rewardsKind: 'expected',
            limits: SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS,
            options: [],
            consentKey: 'staking:everstake',
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'manage' },
            },
            messageSystemFeatures: {},
            minFirmware: {},
            isCountedInAccountTotals: true,
        });
    });

    it('keeps the legacy limits in lamports', () => {
        expect(SOLANA_EVERSTAKE_NATIVE_PRODUCT_LIMITS).toEqual({
            minStakeAmount: '1000000000',
            maxStakeAmount: '10000000000000000',
            minWithdrawalAmount: '20000000',
            feeBufferBalance: '5000000',
            minBalanceForStaking: '1020000000',
            minStakeAmountForDashboard: '1000000000',
            registrationDeposit: '0',
        });
    });

    it('takes the message-system keys it is given', () => {
        expect(
            createSolanaEverstakeNativeProductDescriptor({
                networkSymbol: asNetworkSymbol('sol'),
                provider: everstakeProvider,
                messageSystemFeatures: SOLANA_EVERSTAKE_NATIVE_PRODUCT_MESSAGE_SYSTEM_FEATURES,
            }).messageSystemFeatures,
        ).toEqual({
            stake: 'sol.staking.stake',
            unstake: 'sol.staking.unstake',
            withdraw: 'sol.staking.claim',
        });
    });
});
