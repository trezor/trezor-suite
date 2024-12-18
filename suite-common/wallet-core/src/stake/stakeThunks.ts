import { BigNumber } from '@trezor/utils/src/bigNumber';
import { createThunk } from '@suite-common/redux-utils';
import { TimerId } from '@trezor/type-utils';
import {
    getSolanaStakingSymbols,
    getStakingSymbols,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import {
    SupportedEthereumNetworkSymbol,
    SupportedSolanaNetworkSymbols,
} from '@suite-common/wallet-types';

import { selectEverstakeData } from './stakeSelectors';
import {
    EVERSTAKE_ASSET_ENDPOINT_TYPES,
    EVERSTAKE_ENDPOINT_TYPES,
    EverstakeAssetEndpointType,
    EverstakeEndpointType,
    ValidatorsQueue,
} from './stakeTypes';
import { EVERSTAKE_ENDPOINT_PREFIX } from './stakeConstants';
import { selectAllNetworkSymbolsOfVisibleAccounts } from '../accounts/accountsReducer';

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

export const fetchEverstakeAssetData = createThunk<
    { apy: number },
    {
        symbol: SupportedSolanaNetworkSymbols;
        endpointType: EverstakeAssetEndpointType;
    },
    { rejectValue: string }
>(
    `${STAKE_MODULE}/fetchEverstakeAssetData`,
    async (params, { fulfillWithValue, rejectWithValue }) => {
        const { symbol, endpointType } = params;

        const endpointSuffix = EVERSTAKE_ASSET_ENDPOINT_TYPES[endpointType];
        const endpointPrefix = EVERSTAKE_ENDPOINT_PREFIX[symbol];
        const endpointParams = isSupportedSolStakingNetworkSymbol(symbol) ? `name=solana` : '';

        try {
            const response = await fetch(`${endpointPrefix}/${endpointSuffix}?${endpointParams}`);

            if (!response.ok) {
                throw Error(response.statusText);
            }

            const data = await response.json();

            return fulfillWithValue({
                apy: data.blockchain.apr,
            });
        } catch (error) {
            return rejectWithValue(error.toString());
        }
    },
);

export const initStakeDataThunk = createThunk(
    `${STAKE_MODULE}/initStakeDataThunk`,
    (_, { getState, dispatch, extra }) => {
        //because fetch only happens every 5 minutes we fetch according all devices in case a device is changed within those 5 minutes
        const accountsNetworks = selectAllNetworkSymbolsOfVisibleAccounts(getState());
        //also join with enabled networks in case account was not yet discovered, but network is already enabled
        const enabledNetworks = extra.selectors.selectEnabledNetworks(getState());
        const mergedNetworks = [...new Set([...accountsNetworks, ...enabledNetworks])];

        const ethereumBasedNetworksWithStaking = getStakingSymbols(mergedNetworks);
        const solanaBasedNetworksWithStaking = getSolanaStakingSymbols(mergedNetworks);

        const createPromises = (
            networks: (SupportedSolanaNetworkSymbols | SupportedEthereumNetworkSymbol)[],
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
                            if (isSupportedSolStakingNetworkSymbol(symbol)) {
                                return dispatch(fetchEverstakeAssetData({ symbol, endpointType }));
                            }

                            return dispatch(fetchEverstakeData({ symbol, endpointType }));
                        }

                        return null;
                    }),
                )
                .filter(Boolean);

        const ethPromises = createPromises(ethereumBasedNetworksWithStaking, EverstakeEndpointType);
        const solPromises = createPromises(
            solanaBasedNetworksWithStaking,
            EverstakeAssetEndpointType,
        );

        return Promise.all([...ethPromises, ...solPromises]);
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
