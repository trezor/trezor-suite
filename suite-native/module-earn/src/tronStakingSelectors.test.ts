import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema, stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';

import { selectTronStakingDetails } from './tronStakingSelectors';

const trx = asNetworkSymbol('trx');
const zero = stakingAmountSchema.parse('0');

const tronProduct = mockStakingProductDescriptor({
    networkSymbol: trx,
    providerId: stakingProviderIdSchema.parse('curated'),
    type: 'native',
    operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
    rateKind: 'apr',
    rewardsKind: 'claimable',
    platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
});

const tronDetails = {
    kind: 'tron-staking' as const,
    frozen: { energy: zero, bandwidth: zero },
    delegated: { energy: zero, bandwidth: zero },
    votingPower: stakingAmountSchema.parse('5000000'),
    unallocatedVotingPower: stakingAmountSchema.parse('2000000'),
    rewardClaimAvailableAt: null,
};

const otherDeviceState: StaticSessionId = 'otherWallet@deviceId:1';
const tronAccount = mockWalletAccount({ symbol: trx });
const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const emptyAccount = mockWalletAccount({ symbol: trx, deviceState: otherDeviceState });

const state = {
    earn: {
        staking: mockStakingState({
            platform: 'mobile',
            descriptors: [mockStakingProductDescriptor(), tronProduct],
            positions: {
                [tronAccount.key]: [
                    mockStakingPosition({ productId: tronProduct.id, details: tronDetails }),
                ],
                [ethAccount.key]: [mockStakingPosition()],
            },
        }),
    },
};

describe('selectTronStakingDetails', () => {
    it('returns the tron-staking details of the account position', () => {
        expect(selectTronStakingDetails(state, tronAccount.key)).toBe(
            state.earn.staking.positions[tronAccount.key]?.[tronProduct.id]?.details,
        );
    });

    it('returns null for a position of another kind or no position', () => {
        expect(selectTronStakingDetails(state, ethAccount.key)).toBeNull();
        expect(selectTronStakingDetails(state, emptyAccount.key)).toBeNull();
    });
});
