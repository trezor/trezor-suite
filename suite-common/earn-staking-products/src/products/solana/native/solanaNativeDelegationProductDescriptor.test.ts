import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES,
    createSolanaNativeDelegationProductDescriptor,
} from './solanaNativeDelegationProductDescriptor';
import { SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS } from './solanaNativeDelegationProductLimits';
import { everstakeProvider } from '../../../providers/everstake';

describe('createSolanaNativeDelegationDescriptor', () => {
    it.each([
        { symbol: 'sol', id: 'sol:sol:everstake:native' },
        { symbol: 'dsol', id: 'dsol:dsol:everstake:native' },
    ])('builds the $id product', ({ symbol, id }) => {
        const descriptor = createSolanaNativeDelegationProductDescriptor({
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
            limits: SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS,
            options: [],
            consentKey: 'staking:everstake',
            platforms: {
                desktop: { access: 'manage' },
                mobile: { access: 'manage' },
            },
            messageSystemFeatures: {},
            isCountedInAccountTotals: true,
        });
    });

    it('keeps the legacy limits in lamports', () => {
        expect(SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS).toEqual({
            minStakeAmount: '1000000000',
            maxStakeAmount: '10000000000000000',
            minWithdrawalAmount: '20000000',
            feeBufferBalance: '5000000',
            minBalanceForStaking: '1020000000',
            minStakeAmountForDashboard: '1000000000',
        });
    });

    it('takes the message-system keys it is given', () => {
        expect(
            createSolanaNativeDelegationProductDescriptor({
                networkSymbol: asNetworkSymbol('sol'),
                provider: everstakeProvider,
                messageSystemFeatures: EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES,
            }).messageSystemFeatures,
        ).toEqual({
            stake: 'sol.staking.stake',
            unstake: 'sol.staking.unstake',
            withdraw: 'sol.staking.claim',
        });
    });
});
