import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { UNSTAKING_ETH_PERIOD } from '@suite-common/wallet-constants';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

type GetUnstakingPeriodInDaysFixture = {
    description: string;
    args: {
        networkType?: NetworkType;
        withdrawTime?: number;
        exitTime?: number;
    };
    result: number;
};

export const getUnstakingPeriodInDaysFixture: GetUnstakingPeriodInDaysFixture[] = [
    {
        description: 'should return correct unstaking period in days for ETH',
        args: {
            networkType: 'ethereum',
            withdrawTime: 604800,
            exitTime: 259200,
        },
        result: 10,
    },
    {
        description:
            'should return default unstaking period when withdrawTime is not valid for ETH',
        args: {
            withdrawTime: undefined,
        },
        result: UNSTAKING_ETH_PERIOD,
    },
    {
        description: 'should return Solana epoch duration for SOL',
        args: {
            networkType: 'solana',
        },
        result: SOLANA_EPOCH_DAYS,
    },
    {
        description: 'should return default ETH period when exitTime is missing',
        args: {
            networkType: 'ethereum',
            withdrawTime: 604800,
            exitTime: undefined,
        },
        result: UNSTAKING_ETH_PERIOD,
    },
    {
        description: 'should return default ETH period when both times are undefined',
        args: {
            networkType: 'ethereum',
            withdrawTime: undefined,
            exitTime: undefined,
        },
        result: UNSTAKING_ETH_PERIOD,
    },
    {
        description: 'should default to ETH period when network and times are missing',
        args: {},
        result: UNSTAKING_ETH_PERIOD,
    },
    {
        description:
            'should calculate unstaking period when network is undefined but times are valid',
        args: {
            withdrawTime: 172800,
            exitTime: 86400,
        },
        result: 3,
    },
    {
        description: 'should return 0 when both times are 0',
        args: {
            networkType: 'ethereum',
            withdrawTime: 0,
            exitTime: 0,
        },
        result: 0,
    },
];

type GetMaxStakeAmountFixture = {
    description: string;
    args: {
        balance: string;
        symbol: NetworkSymbol | undefined;
    };
    result: string;
};

export const getMaxStakeAmountFixture: GetMaxStakeAmountFixture[] = [
    {
        description:
            'SOL: reserves the withdrawal amount (0.02), not just the fee buffer, when the balance is well above the staking minimum',
        args: { balance: '5', symbol: 'sol' },
        result: '4.98',
    },
    {
        description:
            'SOL: takes the fee-buffer-only branch because balance minus the fee buffer (0.005) does not exceed MIN_BALANCE_FOR_STAKING (1.02)',
        args: { balance: '1.01', symbol: 'sol' },
        result: '1.005',
    },
    {
        description:
            'SOL: at the exact fee-buffer branch boundary (balance minus the fee buffer equals MIN_BALANCE_FOR_STAKING), still takes the fee-buffer-only branch',
        args: { balance: '1.025', symbol: 'sol' },
        result: '1.02',
    },
    {
        description:
            'SOL: one cent above the boundary, switches to the withdrawal-reserve branch; this is a known non-monotonic step inherited from desktop (max amount drops from 1.02 to 1.006 as balance rises), not something this shared helper introduces',
        args: { balance: '1.026', symbol: 'sol' },
        result: '1.006',
    },
    {
        description: 'SOL: caps the result at the protocol maximum stake amount',
        args: { balance: '10000005', symbol: 'sol' },
        result: '10000000',
    },
    {
        description:
            'SOL: never returns a negative amount when the balance is below the fee buffer',
        args: { balance: '0.001', symbol: 'sol' },
        result: '0',
    },
    {
        description:
            'ETH: withdrawal reserve equals the fee buffer (both 0.005), so max leaves 0.005 regardless of the branch',
        args: { balance: '5', symbol: 'eth' },
        result: '4.995',
    },
    {
        description: 'returns 0 (fails safe, reserves everything) for a non-staking network symbol',
        args: { balance: '5', symbol: 'btc' },
        result: '0',
    },
    {
        description: 'TRX: below the withdrawal-branch threshold, reserves the full fee buffer (5)',
        args: { balance: '6', symbol: 'trx' },
        result: '1',
    },
    {
        description:
            'TRX: just above the threshold, reserves only the withdrawal amount (0.01) instead of the 5 TRX fee buffer, a steep cliff inherited from desktop',
        args: { balance: '6.02', symbol: 'trx' },
        result: '6.01',
    },
    {
        description:
            'ADA: delegation is liquid, so both the fee buffer and the withdrawal reserve are 0 and the max amount is the full balance',
        args: { balance: '5', symbol: 'ada' },
        result: '5',
    },
    {
        description: 'ADA: a dust balance is still fully stakeable because nothing is reserved',
        args: { balance: '0.001', symbol: 'ada' },
        result: '0.001',
    },
];
