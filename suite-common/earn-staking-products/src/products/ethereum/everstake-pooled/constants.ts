import { type StakingOperation } from '@suite-common/earn-staking-common';

export const ETHEREUM_EVERSTAKE_OPERATIONS_BY_METHOD_ID: Partial<Record<string, StakingOperation>> =
    {
        '0x3a29dbae': 'stake',
        '0x76ec871c': 'unstake',
        '0x33986ffa': 'withdraw',
    };
