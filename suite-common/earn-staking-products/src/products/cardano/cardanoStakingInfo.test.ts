import type { StakingAccount } from '@suite-common/earn-staking-common';
import { mockStakingAccount } from '@suite-common/earn-staking-common/mocks';
import {
    MOCK_CARDANO_EVERSTAKE_DREP_ID,
    MOCK_CARDANO_EVERSTAKE_POOL,
    mockCardanoStakingAccount,
} from '@suite-common/wallet-types/mocks';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { parseCardanoStakingInfo } from './cardanoStakingInfo';

type CardanoStakingInfo = NonNullable<NonNullable<StakingAccount['misc']>['staking']>;

const mockCardanoAccount = (staking: Partial<CardanoStakingInfo>) =>
    mockStakingAccount({
        symbol: asNetworkSymbol('ada'),
        misc: {
            staking: {
                address: 'stake1u9ylzsgxaa6xctf4juup682ar3juj85n8tx3hthnljg47zctvm3rc',
                isActive: true,
                rewards: '0',
                poolId: MOCK_CARDANO_EVERSTAKE_POOL,
                drep: null,
                ...staking,
            },
        },
    });

const drep = (drepId: string, hasScript = false) => ({
    drep_id: drepId,
    hex: '',
    amount: '0',
    active: true,
    active_epoch: null,
    has_script: hasScript,
});

describe('parseCardanoStakingInfo', () => {
    it('reads the pool, the rewards and the DRep of a registered stake key', () => {
        expect(parseCardanoStakingInfo(mockCardanoStakingAccount('everstake'))).toEqual({
            poolId: MOCK_CARDANO_EVERSTAKE_POOL,
            rewards: '5250000',
            drep: { id: MOCK_CARDANO_EVERSTAKE_DREP_ID, hasScript: false },
        });
    });

    it('reads nothing from a stake key that is not registered', () => {
        expect(parseCardanoStakingInfo(mockCardanoStakingAccount('notDelegated'))).toBeNull();
    });

    it('reads nothing from an account without staking info', () => {
        expect(
            parseCardanoStakingInfo(mockStakingAccount({ symbol: asNetworkSymbol('ada') })),
        ).toBeNull();
    });

    it('reads an empty pool id as no pool', () => {
        expect(parseCardanoStakingInfo(mockCardanoAccount({ poolId: '' }))?.poolId).toBeNull();
    });

    it('reads a DRep without an id as no DRep', () => {
        expect(parseCardanoStakingInfo(mockCardanoAccount({ drep: drep('') }))?.drep).toBeNull();
    });

    it('keeps the script flag of the DRep', () => {
        expect(
            parseCardanoStakingInfo(
                mockCardanoAccount({ drep: drep(MOCK_CARDANO_EVERSTAKE_DREP_ID, true) }),
            )?.drep,
        ).toEqual({ id: MOCK_CARDANO_EVERSTAKE_DREP_ID, hasScript: true });
    });

    it('reads nothing from a stake key with malformed rewards', () => {
        expect(parseCardanoStakingInfo(mockCardanoAccount({ rewards: '1.5' }))).toBeNull();
    });
});
