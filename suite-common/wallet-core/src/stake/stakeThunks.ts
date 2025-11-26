import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol, networksCollection } from '@suite-common/wallet-config';
import {
    SupportedCardanoNetworkSymbols,
    SupportedEthereumNetworkSymbol,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';
import {
    isSupportedAdaStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    isTestnet,
} from '@suite-common/wallet-utils';
import { TimerId } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import {
    EVERSTAKE_API_KEY,
    EVERSTAKE_ENDPOINT_PREFIX,
    EVERSTAKE_REWARDS_SOLANA_ENPOINT,
    EVERSTAKE_VALIDATOR,
} from './stakeConstants';
import { selectEverstakeData } from './stakeSelectors';
import {
    CardanoValidatorStats,
    EVERSTAKE_ASSET_ENDPOINT_TYPES,
    EVERSTAKE_ENDPOINT_TYPES,
    EverstakeAssetEndpointType,
    EverstakeEndpointType,
    EverstakeRewardsEndpointType,
    EverstakeStakingInfo,
    StakeRewardsByAccount,
    TotalStakeRewardsByAccount,
    ValidatorsQueue,
} from './stakeTypes';
import { selectEnabledNetworks } from '../settings/walletSettingsReducer';

const STAKE_MODULE = '@common/wallet-core/stake';

export const fetchEverstakeData = createThunk<
    ValidatorsQueue | { ethApy: number; nextRewardPayout: number },
    {
        symbol: SupportedEthereumNetworkSymbol;
        endpointType: EverstakeEndpointType;
    },
    { rejectValue: string }
>(`${STAKE_MODULE}/fetchEverstakeData`, async (params, { fulfillWithValue, rejectWithValue }) => {
    const { symbol, endpointType } = params;

    const endpointSuffix = EVERSTAKE_ENDPOINT_TYPES[endpointType];
    const endpointPrefix = EVERSTAKE_ENDPOINT_PREFIX[symbol];

    try {
        const response = await fetch(`${endpointPrefix}/${endpointSuffix}`);

        if (!response.ok) {
            throw Error(response.statusText);
        }

        const data = await response.json();

        if (endpointType === EverstakeEndpointType.PoolStats) {
            return fulfillWithValue({
                ethApy: Number(
                    new BigNumber(data.apr).times(100).toPrecision(3, BigNumber.ROUND_DOWN),
                ),
                nextRewardPayout: Math.ceil(data.next_reward_payout_in / 60 / 60 / 24),
            });
        }

        return fulfillWithValue({
            validatorsEnteringNum: data.validators_entering_num,
            validatorsExitingNum: data.validators_exiting_num,
            validatorsTotalCount: data.validators_total_count,
            validatorsPerEpoch: data.validators_per_epoch,
            validatorActivationTime: data.validator_activation_time,
            validatorExitTime: data.validator_exit_time,
            validatorWithdrawTime: data.validator_withdraw_time,
            validatorAddingDelay: data.validator_adding_delay,
            updatedAt: data.updated_at,
        } as ValidatorsQueue);
    } catch (error) {
        return rejectWithValue(error.toString());
    }
});

const getStakingInfoEndpointParams = (symbol: NetworkSymbol) => {
    if (isSupportedSolStakingNetworkSymbol(symbol)) {
        return `name=solana`;
    }
    if (isSupportedAdaStakingNetworkSymbol(symbol)) {
        return `limit=1000&offset=0&partner=Trezor`;
    }

    return '';
};

export const fetchEverstakeStakingInfo = createThunk<
    EverstakeStakingInfo,
    {
        symbol: SupportedSolanaNetworkSymbols | SupportedCardanoNetworkSymbols;
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
                    headers: isSupportedAdaStakingNetworkSymbol(symbol)
                        ? { 'x-api-key': EVERSTAKE_API_KEY }
                        : undefined,
                },
            );
            if (!assetResponse.ok) {
                throw Error(assetResponse.statusText);
            }
            const assetData = await assetResponse.json();

            if (isSupportedAdaStakingNetworkSymbol(symbol)) {
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
        symbol: SupportedSolanaNetworkSymbols;
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

        const enabledNetworks = selectEnabledNetworks(getState());

        if (
            !networksCollection.some(
                network =>
                    network.networkType !== 'bitcoin' && enabledNetworks.includes(network.symbol),
            )
        ) {
            return;
        }

        // TODO: change to accept only mainnet
        const createPromises = (
            networks: (
                | SupportedSolanaNetworkSymbols
                | SupportedEthereumNetworkSymbol
                | SupportedCardanoNetworkSymbols
            )[],
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
                            if (
                                isSupportedSolStakingNetworkSymbol(symbol) ||
                                isSupportedAdaStakingNetworkSymbol(symbol)
                            ) {
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
