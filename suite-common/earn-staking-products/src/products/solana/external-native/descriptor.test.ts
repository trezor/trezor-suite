import { stakingProductDescriptorSchema } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaExternalNativeProductDescriptor } from './descriptor';

describe('createSolanaExternalDelegationDescriptor', () => {
    it.each([
        { symbol: 'sol', id: 'sol:sol:external:native' },
        { symbol: 'dsol', id: 'dsol:dsol:external:native' },
    ])('builds the read-only $id product', ({ symbol, id }) => {
        const descriptor = createSolanaExternalNativeProductDescriptor(asNetworkSymbol(symbol));

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
            rewardsKind: 'expected',
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
                desktop: { access: 'read-only' },
                mobile: { access: 'read-only' },
            },
            messageSystemFeatures: {},
            minFirmware: {},
            isCountedInAccountTotals: false,
        });
    });
});
