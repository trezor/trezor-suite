export type SolanaReward = {
    epoch: number;
    delegator: string;
    amount: string;
    currency: string;
    time: string;
};

export type SolanaStakingAccount = {
    account: {
        data: [string, 'base64'];
        executable: boolean;
        lamports: number;
        owner: string;
        rentEpoch: string;
        space: number;
    };
    pubkey: string;
};

type SolanaStakingAccountDecoded = {
    state: {
        __kind: 'Stake';
        fields: [
            {
                rentExemptReserve: string;
                authorized: {
                    staker: string;
                    withdrawer: string;
                };
                lockup: {
                    unixTimestamp: string;
                    epoch: string;
                    custodian: string;
                };
            },
            {
                delegation: {
                    voterPubkey: string;
                    stake: string;
                    activationEpoch: string;
                    deactivationEpoch: string;
                    warmupCooldownRate: number;
                };
                creditsObserved: string;
            },
            {
                bits: number;
            },
        ];
    };
};

// State of stake is defined by comparing activationEpoch, deactivationEpoch and current epoch
// stakeAccountState in packages/blockchain-link/src/workers/solana/utils/stakingAccounts.ts
// ATM our tests operate with mocked epoch info where epoch is frozen to 864
const activeFirst: SolanaStakingAccount = {
    account: {
        data: [
            'AgAAAIDVIgAAAAAAUmFf8A6VI0pKOVEke559+E+OI7KNM3QcnXkN+plt4fxSYV/wDpUjSko5USR7nn34T44jso0zdBydeQ36mW3h/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHzgaQ+C+2FHX+u9FgXvIMNGqRZ3BtgpzkaZQ1xMJ4Cuu0/6CwAAAABgAwAAAAAAAP//////////AAAAAAAA0D8sQwlYAAAAAAAAAAA=',
            'base64',
        ],
        executable: false,
        lamports: 203236667,
        owner: 'Stake11111111111111111111111111111111111111',
        rentEpoch: '18446744073709551615',
        space: 200,
    },
    pubkey: 'kiGjTkU1gDp5mwrd4ceth6jCZrU1Ynm8M57ysHhdeSS',
};

const activeFirstDecoded: SolanaStakingAccountDecoded = {
    state: {
        __kind: 'Stake',
        fields: [
            {
                rentExemptReserve: '2282880',
                authorized: {
                    staker: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                    withdrawer: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                },
                lockup: {
                    unixTimestamp: '0',
                    epoch: '0',
                    custodian: '11111111111111111111111111111111',
                },
            },
            {
                delegation: {
                    voterPubkey: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
                    stake: '200953787',
                    activationEpoch: '864',
                    deactivationEpoch: '18446744073709551615',
                    warmupCooldownRate: 0.25,
                },
                creditsObserved: '1477002028',
            },
            {
                bits: 0,
            },
        ],
    },
};

const activeSecond: SolanaStakingAccount = {
    account: {
        data: [
            'AgAAAIDVIgAAAAAAAd2KMZOenUYpy9lHHAjmZoDITGrJjJQMNyxulGUNXYYB3Yoxk56dRinL2UccCOZmgMhMasmMlAw3LG6UZQ1dhgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHzgaQ+C+2FHX+u9FgXvIMNGqRZ3BtgpzkaZQ1xMJ4Cu/pXMAQAAAABrAwAAAAAAAP//////////AAAAAAAA0D8sQwlYAAAAAAAAAAA=',
            'base64',
        ],
        executable: false,
        lamports: 32467838,
        owner: 'Stake11111111111111111111111111111111111111',
        rentEpoch: '18446744073709551615',
        space: 200,
    },
    pubkey: '2ZCTggwLjmjqK5zPxMbT5gh44gPAH2sCjjrrAyqBMRoT',
};

const activeSecondDecoded: SolanaStakingAccountDecoded = {
    state: {
        __kind: 'Stake',
        fields: [
            {
                rentExemptReserve: '2282880',
                authorized: {
                    staker: '8HLeB6GhRLibM47NsYj9C5C5wAYPCLGTTqbk5gqrhiM',
                    withdrawer: '8HLeB6GhRLibM47NsYj9C5C5wAYPCLGTTqbk5gqrhiM',
                },
                lockup: {
                    unixTimestamp: '0',
                    epoch: '0',
                    custodian: '11111111111111111111111111111111',
                },
            },
            {
                delegation: {
                    voterPubkey: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
                    stake: '30184958',
                    activationEpoch: '875',
                    deactivationEpoch: '18446744073709551615',
                    warmupCooldownRate: 0.25,
                },
                creditsObserved: '1477002028',
            },
            {
                bits: 0,
            },
        ],
    },
};

const deactivating: SolanaStakingAccount = {
    account: {
        data: [
            'AgAAAIDVIgAAAAAA7vzZi8sD1pc0mQI6dCPLIml2GzezUE4yE3QSa3HiAobu/NmLywPWlzSZAjp0I8siaXYbN7NQTjITdBJrceIChgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHzgaQ+C+2FHX+u9FgXvIMNGqRZ3BtgpzkaZQ1xMJ4CuOd4CAgAAAABdAwAAAAAAAG0DAAAAAAAAAAAAAAAA0D/fyzZXAAAAAAAAAAA=',
            'base64',
        ],
        executable: false,
        lamports: 36025273,
        owner: 'Stake11111111111111111111111111111111111111',
        rentEpoch: '18446744073709551615',
        space: 200,
    },
    pubkey: 'BbzZ9ArPmGDHm8TXciyFfsprmdLcCuW33ZWwmbKV9oXZ',
};
const deactivatingDecoded: SolanaStakingAccountDecoded = {
    state: {
        __kind: 'Stake',
        fields: [
            {
                rentExemptReserve: '2282880',
                authorized: {
                    staker: 'H5uev4ENYn99GXRwzkQ2Ho5duvCVc34QsmibDfURkQWZ',
                    withdrawer: 'H5uev4ENYn99GXRwzkQ2Ho5duvCVc34QsmibDfURkQWZ',
                },
                lockup: {
                    unixTimestamp: '0',
                    epoch: '0',
                    custodian: '11111111111111111111111111111111',
                },
            },
            {
                delegation: {
                    voterPubkey: '9QU2QSxhb24FUX3Tu2FpczXjpK3VYrvRudywSZaM29mF',
                    stake: '33742393',
                    activationEpoch: '861',
                    deactivationEpoch: '877',
                    warmupCooldownRate: 0.25,
                },
                creditsObserved: '1463208927',
            },
            {
                bits: 0,
            },
        ],
    },
};

class SolanaStakingAccountFixture {
    constructor(
        public payload: SolanaStakingAccount,
        public decoded: SolanaStakingAccountDecoded,
    ) {}

    get stakeInSol(): string {
        return (Number(this.decoded.state.fields[1].delegation.stake) / 1_000_000_000).toString();
    }

    get stakeAndRentInSol(): string {
        return (
            (Number(this.decoded.state.fields[1].delegation.stake) +
                Number(this.decoded.state.fields[0].rentExemptReserve)) /
            1_000_000_000
        ).toString();
    }

    get activationEpoch(): number {
        return Number(this.decoded.state.fields[1].delegation.activationEpoch);
    }

    get deactivationEpoch(): number {
        return Number(this.decoded.state.fields[1].delegation.deactivationEpoch);
    }
}

export const solStakingAccountFirst = new SolanaStakingAccountFixture(
    activeFirst,
    activeFirstDecoded,
);
export const solStakingAccountSecond = new SolanaStakingAccountFixture(
    activeSecond,
    activeSecondDecoded,
);
export const solStakingAccountDeactivating = new SolanaStakingAccountFixture(
    deactivating,
    deactivatingDecoded,
);

export const totalReward = {
    url: '**/sol/rewards/8NapsSamBA2jd8VR8SZw4aXSvSAHiskUZXaiYW1HxTGe/total',
    response: { total: '1139693' },
};

export const rewards: {
    url: string;
    response: { rewards: SolanaReward[]; totalCount: number };
} = {
    url: '**/sol/rewards/8NapsSamBA2jd8VR8SZw4aXSvSAHiskUZXaiYW1HxTGe**',
    response: {
        rewards: [
            {
                epoch: 877,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '144018',
                currency: 'SOL',
                time: '2025-11-11T03:30:17Z',
            },
            {
                epoch: 876,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '144188',
                currency: 'SOL',
                time: '2025-11-09T03:28:04Z',
            },
            {
                epoch: 875,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '118296',
                currency: 'SOL',
                time: '2025-11-07T03:26:05Z',
            },
            {
                epoch: 874,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '68554',
                currency: 'SOL',
                time: '2025-11-05T03:22:58Z',
            },
            {
                epoch: 873,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69061',
                currency: 'SOL',
                time: '2025-11-03T03:15:20Z',
            },
            {
                epoch: 872,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69075',
                currency: 'SOL',
                time: '2025-11-01T03:11:13Z',
            },
            {
                epoch: 871,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69049',
                currency: 'SOL',
                time: '2025-10-30T02:56:16Z',
            },
            {
                epoch: 870,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69160',
                currency: 'SOL',
                time: '2025-10-28T03:10:37Z',
            },
            {
                epoch: 869,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69050',
                currency: 'SOL',
                time: '2025-10-26T03:33:27Z',
            },
            {
                epoch: 868,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '70142',
                currency: 'SOL',
                time: '2025-10-24T03:54:06Z',
            },
            {
                epoch: 867,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69864',
                currency: 'SOL',
                time: '2025-10-22T04:09:37Z',
            },
            {
                epoch: 866,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '69681',
                currency: 'SOL',
                time: '2025-10-20T04:20:38Z',
            },
            {
                epoch: 865,
                delegator: '6YaYu1rHw95rtyrADg1pgrKuDPB3fte8GdRAcAUyx3zK',
                amount: '109555',
                currency: 'SOL',
                time: '1970-01-01T00:00:00Z',
            },
        ],
        totalCount: 13,
    },
};
