import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    CardanoValidatorStats,
    EVERSTAKE_ASSET_ENDPOINT_TYPES,
    EVERSTAKE_ENDPOINT_TYPES,
    EverstakeAssetEndpointType,
    EverstakeDataParams,
    EverstakeEndpointType,
    EverstakeRewardsEndpointType,
    EverstakeStakingInfo,
    StakeRewardsByAccount,
    TotalStakeRewardsByAccount,
    ValidatorsQueue,
} from '@suite-common/wallet-types';
import { isTestnet } from '@suite-common/wallet-utils';
import { TimerId } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import {
    EVERSTAKE_API_KEY,
    EVERSTAKE_ENDPOINT_PREFIX,
    EVERSTAKE_REWARDS_SOLANA_ENPOINT,
    EVERSTAKE_VALIDATOR,
} from './stakeConstants';
import { selectEverstakeData } from './stakeSelectors';

const STAKE_MODULE = '@common/wallet-core/stake';

export async function fetchEverstakeDataApi(params: EverstakeDataParams) {
    const { symbol, endpointType, timestamp } = params;

    if (symbol !== 'eth') {
        throw new Error('Only Ethereum is supported for this endpoint');
    }

    const endpointSuffix = EVERSTAKE_ENDPOINT_TYPES[endpointType];
    const endpointPrefix = EVERSTAKE_ENDPOINT_PREFIX[symbol];

    const response = await fetch(
        `${endpointPrefix}/${endpointSuffix}${timestamp ? `?timestamp=${timestamp}` : ''}`,
    );

    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();

    if (endpointType === EverstakeEndpointType.PoolStats) {
        return {
            ethApy: Number(new BigNumber(data.apr).times(100).toPrecision(3, BigNumber.ROUND_DOWN)),
            nextRewardPayout: Math.ceil(data.next_reward_payout_in / 60 / 60 / 24),
        };
    }

    return {
        validatorsEnteringNum: data.validators_entering_num,
        validatorsExitingNum: data.validators_exiting_num,
        validatorsTotalCount: data.validators_total_count,
        validatorsPerEpoch: data.validators_per_epoch,
        validatorActivationTime: data.validator_activation_time,
        validatorExitTime: data.validator_exit_time,
        validatorWithdrawTime: data.validator_withdraw_time,
        validatorAddingDelay: data.validator_adding_delay,
        updatedAt: data.updated_at,
    };
}

export const fetchEverstakeData = createThunk<
    ValidatorsQueue | { ethApy: number; nextRewardPayout: number },
    EverstakeDataParams,
    { rejectValue: string }
>(`${STAKE_MODULE}/fetchEverstakeData`, async (params, { fulfillWithValue, rejectWithValue }) => {
    try {
        const data = await fetchEverstakeDataApi(params);

        return fulfillWithValue(data);
    } catch (error) {
        return rejectWithValue(error.toString());
    }
});

const getStakingInfoEndpointParams = (symbol: NetworkSymbol) => {
    switch (symbol) {
        case 'sol':
            return 'name=solana';

        case 'ada':
            return 'limit=1000&offset=0&partner=Trezor';

        default:
            return '';
    }
};

export const fetchEverstakeStakingInfo = createThunk<
    EverstakeStakingInfo,
    {
        symbol: 'sol' | 'ada';
        endpointType: EverstakeAssetEndpointType;
    },
    { rejectValue: string }
>(
    `${STAKE_MODULE}/fetchEverstakeAssetData`,
    async (params, { fulfillWithValue, rejectWithValue }) => {
        const { symbol, endpointType } = params;

        const endpointSuffix = EVERSTAKE_ASSET_ENDPOINT_TYPES[endpointType][symbol];
        const endpointPrefix = EVERSTAKE_ENDPOINT_PREFIX[symbol];
        const endpointParams = getStakingInfoEndpointParams(symbol);

        try {
            const assetResponse = await fetch(
                `${endpointPrefix}/${endpointSuffix}?${endpointParams}`,
                {
                    headers: symbol === 'ada' ? { 'x-api-key': EVERSTAKE_API_KEY } : undefined,
                },
            );
            if (!assetResponse.ok) {
                throw Error(assetResponse.statusText);
            }
            const assetData = await assetResponse.json();

            if (symbol === 'ada') {
                return fulfillWithValue({
                    pools: assetData?.data?.map((pool: CardanoValidatorStats) => ({
                        apy: Number(pool.apy.value),
                        saturation: Number(pool.saturation) * 100,
                        id: pool.validator_address,
                    })),
                });
            }

            return fulfillWithValue({
                apy: Number(assetData?.blockchain?.apr),
            });
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export const fetchEverstakeRewards = createThunk<
    { rewardsHistory: StakeRewardsByAccount; totalRewards: TotalStakeRewardsByAccount },
    {
        symbol: 'sol';
        endpointType: EverstakeRewardsEndpointType;
        address: string;
        signal?: AbortSignal;
    },
    { rejectValue: string }
>(
    `${STAKE_MODULE}/fetchEverstakeRewardsData`,
    async (params, { fulfillWithValue, rejectWithValue }) => {
        const { address, signal, symbol } = params;

        const isSolanaMainnet = !isTestnet(symbol);

        if (!isSolanaMainnet) return rejectWithValue('Only Solana mainnet is supported.');

        try {
            const rewardsHistoryResponse = await fetch(
                `${EVERSTAKE_REWARDS_SOLANA_ENPOINT}/${address}`,
                {
                    method: 'POST',
                    body: `validator=${encodeURIComponent(EVERSTAKE_VALIDATOR)}`,
                    signal,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            if (!rewardsHistoryResponse.ok) {
                throw Error(rewardsHistoryResponse.statusText);
            }

            const rewardsHistory = await rewardsHistoryResponse.json();

            const totalRewardsResponse = await fetch(
                `${EVERSTAKE_REWARDS_SOLANA_ENPOINT}/${address}/total?validator=${EVERSTAKE_VALIDATOR}`,
            );
            if (!totalRewardsResponse.ok) {
                throw Error(totalRewardsResponse.statusText);
            }
            const totalRewardsData = await totalRewardsResponse.json();

            return fulfillWithValue({
                rewardsHistory: {
                    [address]: rewardsHistory,
                },
                totalRewards: {
                    [address]: totalRewardsData?.rewards?.toString(),
                },
            });
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export const initStakeDataThunk = createThunk(
    `${STAKE_MODULE}/initStakeDataThunk`,
    (_, { getState, dispatch }) => {
        // because fetch only happens every 5 minutes we fetch according all devices in case a device is changed within those 5 minutes

        const isBitcoinOnlyFirmware = selectHasBitcoinOnlyFirmware(getState());

        if (isBitcoinOnlyFirmware) return;

        const createPromises = (
            networks: ['eth' | 'sol' | 'ada'],
            endpointTypes: typeof EverstakeEndpointType | typeof EverstakeAssetEndpointType,
        ) =>
            networks
                .flatMap(symbol =>
                    Object.values(endpointTypes).map(endpointType => {
                        const data = selectEverstakeData(getState(), symbol, endpointType);
                        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

                        const shouldRefetch =
                            data?.error ||
                            !data?.lastSuccessfulFetchTimestamp ||
                            data?.lastSuccessfulFetchTimestamp <= fiveMinutesAgo;

                        if (shouldRefetch) {
                            if (isTestnet(symbol)) return null;

                            if (symbol === 'sol' || symbol === 'ada') {
                                return dispatch(
                                    fetchEverstakeStakingInfo({
                                        symbol,
                                        endpointType,
                                    }),
                                );
                            }

                            return dispatch(fetchEverstakeData({ symbol, endpointType }));
                        }

                        return null;
                    }),
                )
                .filter(Boolean);

        const ethPromises = createPromises(['eth'], EverstakeEndpointType);
        const solPromises = createPromises(['sol'], EverstakeAssetEndpointType);
        const adaPromises = createPromises(['ada'], EverstakeAssetEndpointType);

        return Promise.all([...ethPromises, ...solPromises, ...adaPromises]);
    },
);

let stakeDataTimeout: TimerId | null = null;

export const periodicCheckStakeDataThunk = createThunk(
    `${STAKE_MODULE}/periodicCheckStakeDataThunk`,
    (_, { dispatch }) => {
        if (stakeDataTimeout) {
            clearTimeout(stakeDataTimeout);
        }

        stakeDataTimeout = setTimeout(() => {
            dispatch(periodicCheckStakeDataThunk());
        }, 60_000);

        return dispatch(initStakeDataThunk());
    },
);
