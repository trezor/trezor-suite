import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import {
    EVERSTAKE_SOLANA_MESSAGE_SYSTEM_FEATURES,
    SOLANA_NATIVE_DELEGATION_LIMITS,
    createSolanaExternalDelegationDescriptor,
    createSolanaNativeDelegationDescriptor,
} from './solanaDelegationDescriptors';
import { everstakeProvider } from '../providers/everstake';

describe('createSolanaNativeDelegationDescriptor', () => {
    it.each([
        { symbol: 'sol', id: 'sol:sol:everstake:native' },
        { symbol: 'dsol', id: 'dsol:dsol:everstake:native' },
    ])('builds the $id product', ({ symbol, id }) => {
        const descriptor = createSolanaNativeDelegationDescriptor({
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
            limits: SOLANA_NATIVE_DELEGATION_LIMITS,
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
        expect(SOLANA_NATIVE_DELEGATION_LIMITS).toEqual({
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
            createSolanaNativeDelegationDescriptor({
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

describe('createSolanaExternalDelegationDescriptor', () => {
    it.each([
        { symbol: 'sol', id: 'sol:sol:external:native' },
        { symbol: 'dsol', id: 'dsol:dsol:external:native' },
    ])('builds the read-only $id product', ({ symbol, id }) => {
        const descriptor = createSolanaExternalDelegationDescriptor(asNetworkSymbol(symbol));

        expect(stakingProductDescriptorSchema.safeParse(descriptor).success).toBe(true);
        expect(descriptor).toEqual({
            id,
            networkSymbol: symbol,
            asset: { kind: 'native' },
            providerId: 'external',
            type: 'native',
            operations: [],
            exclusivity: 'none',
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
                desktop: { access: 'read-only' },
                mobile: { access: 'read-only' },
            },
            messageSystemFeatures: {},
            isCountedInAccountTotals: false,
        });
    });
});
