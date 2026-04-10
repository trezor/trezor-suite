import { type NetworkType } from '@suite-common/wallet-config';
import { SOLANA_EPOCH_DAYS, UNSTAKING_ETH_PERIOD } from '@suite-common/wallet-constants';

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
