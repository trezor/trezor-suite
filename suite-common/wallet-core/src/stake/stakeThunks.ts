import { ZodError } from 'zod';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { NetworkConfig } from '@suite-common/wallet-config';
import {
    EVERSTAKE_ASSET_ENDPOINT_TYPES,
    EVERSTAKE_ENDPOINT_TYPES,
    EverstakeAssetEndpointType,
    EverstakeDataParams,
    EverstakeEndpointType,
    EverstakeRewardsEndpointType,
    EverstakeStakingInfo,
} from '@suite-common/wallet-types';
import { isTestnet, requestUrl } from '@suite-common/wallet-utils';
import { TimerId } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { CardanoStatsResponse } from './api/schemas/everstake-ada-stats';
import { PoolStatsResponse, ValidatorsQueueResponse } from './api/schemas/everstake-eth-b2c';
import { SolanaDashboardResponse } from './api/schemas/everstake-sol-dashboard';
import {
    SolanaStakeAccountRewardsResponse,
    SolanaTotalStakeRewardsResponse,
} from './api/schemas/everstake-sol-rewards';
import {
    EthereumValidatorsQueue,
    SolanaStakeRewardsByAccount,
    SolanaTotalStakeRewardsByAccount,
} from './api/types';
import {
    EVERSTAKE_API_KEY,
    EVERSTAKE_ENDPOINT_PREFIX,
    EVERSTAKE_REWARDS_SOLANA_ENPOINT,
    EVERSTAKE_VALIDATOR,
} from './stakeConstants';
import { selectEverstakeData } from './stakeSelectors';

const STAKE_MODULE = '@common/wallet-core/stake';

export type EverstakeResultData =
    | EthereumValidatorsQueue
    | { ethApy: number; nextRewardPayout: number };

export const fetchEverstakeData = createThunk<
    EverstakeResultData,
    {
        symbol: Extract<NetworkConfig['symbol'], 'eth'>;
        endpointType: EverstakeEndpointType;
    },
    { rejectValue: string }
>(`${STAKE_MODULE}/fetchEverstakeData`, async (params, { fulfillWithValue, rejectWithValue }) => {
    const { symbol, endpointType } = params;

    try {
        if (symbol !== 'eth') {
            throw new Error('Only Ethereum is supported for this endpoint');
        }

        const response = await fetch(
            requestUrl({
                base: EVERSTAKE_ENDPOINT_PREFIX[symbol],
                pathname: EVERSTAKE_ENDPOINT_TYPES[endpointType],
            }),
        );

        if (!response.ok) {
            throw Error(response.statusText);
        }

        const data = await response.json();

        if (endpointType === EverstakeEndpointType.PoolStats) {
            const { apr, next_reward_payout_in = 0 } = PoolStatsResponse.parse(data);

            return fulfillWithValue({
                ethApy: Number(new BigNumber(apr).times(100).toPrecision(3, BigNumber.ROUND_DOWN)),
                nextRewardPayout: Math.ceil(next_reward_payout_in / 60 / 60 / 24),
            });
        }

        const parsedData = ValidatorsQueueResponse.parse(data);

        return fulfillWithValue({
            validatorActivationTime: parsedData.validator_activation_time,
            validatorExitTime: parsedData.validator_exit_time,
            validatorWithdrawTime: parsedData.validator_withdraw_time,
            validatorAddingDelay: parsedData.validator_adding_delay,
            updatedAt: parsedData.updated_at,
        } satisfies EthereumValidatorsQueue);
    } catch (error) {
        if (error instanceof ZodError) {
            console.error(error);
        }

        return rejectWithValue(error.toString());
    }
});

const getStakingInfoEndpointParams = (
    symbol: Extract<NetworkConfig['symbol'], 'sol' | 'ada'>,
): Record<string, string> | undefined => {
    switch (symbol) {
        case 'sol':
            return {
                name: 'solana',
            };

        case 'ada':
            return {
                limit: '1000',
                offset: '0',
                partner: 'Trezor',
            };

        default:
            return undefined;
    }
};

export const fetchEverstakeStakingInfo = createThunk<
    EverstakeStakingInfo,
    {
        symbol: Extract<NetworkConfig['symbol'], 'sol' | 'ada'>;
        endpointType: EverstakeAssetEndpointType;
    },
    { rejectValue: string }
>(
    `${STAKE_MODULE}/fetchEverstakeAssetData`,
    async (params, { fulfillWithValue, rejectWithValue }) => {
        const { symbol, endpointType } = params;

        try {
            const assetResponse = await fetch(
                requestUrl({
                    base: EVERSTAKE_ENDPOINT_PREFIX[symbol],
                    pathname: EVERSTAKE_ASSET_ENDPOINT_TYPES[endpointType][symbol],
                    searchParams: getStakingInfoEndpointParams(symbol),
                }),
                {
                    headers: symbol === 'ada' ? { 'x-api-key': EVERSTAKE_API_KEY } : undefined,
                },
            );

            if (!assetResponse.ok) {
                throw Error(assetResponse.statusText);
            }

            const assetData = await assetResponse.json();

            if (symbol === 'ada') {
                const { data: pools } = CardanoStatsResponse.parse(assetData);

                return fulfillWithValue({
                    pools: pools.map(pool => ({
                        apy: Number(pool.apy.value),
                        saturation: Number(pool.saturation) * 100,
                        id: pool.validator_address,
                    })),
                });
            }

            const { blockchain } = SolanaDashboardResponse.parse(assetData);

            return fulfillWithValue({
                apy: Number(blockchain.apr),
            });
        } catch (error) {
            if (error instanceof ZodError) {
                console.error(error);
            }

            return rejectWithValue(error.toString());
        }
    },
);

export const fetchEverstakeRewards = createThunk<
    {
        rewardsHistory: SolanaStakeRewardsByAccount;
        totalRewards: SolanaTotalStakeRewardsByAccount;
    },
    {
        symbol: Extract<NetworkConfig['symbol'], 'sol'>;
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
                requestUrl({
                    base: EVERSTAKE_REWARDS_SOLANA_ENPOINT,
                    pathname: address,
                }),
                {
                    method: 'POST',
                    body: new URLSearchParams({ validator: EVERSTAKE_VALIDATOR }),
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

            const parsedRewardsHistory = SolanaStakeAccountRewardsResponse.parse(rewardsHistory);

            const totalRewardsResponse = await fetch(
                requestUrl({
                    base: EVERSTAKE_REWARDS_SOLANA_ENPOINT,
                    pathname: `${address}/total`,
                    searchParams: { validator: EVERSTAKE_VALIDATOR },
                }),
            );
            if (!totalRewardsResponse.ok) {
                throw Error(totalRewardsResponse.statusText);
            }
            const totalRewardsData = await totalRewardsResponse.json();

            const { rewards } = SolanaTotalStakeRewardsResponse.parse(totalRewardsData);

            return fulfillWithValue({
                rewardsHistory: {
                    [address]: parsedRewardsHistory,
                },
                totalRewards: {
                    [address]: rewards,
                },
            });
        } catch (error) {
            if (error instanceof ZodError) {
                console.error(error);
            }

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
            networks: Extract<NetworkConfig['symbol'], 'eth' | 'sol' | 'ada'>[],
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
