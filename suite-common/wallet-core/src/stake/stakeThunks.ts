import { BigNumber } from '@trezor/utils/src/bigNumber';
import { createThunk } from '@suite-common/redux-utils';
import { Timeout } from '@trezor/type-utils';

import { selectEverstakeData } from './stakeSelectors';
import {
    EVERSTAKE_ENDPOINT_PREFIX,
    EVERSTAKE_ENDPOINT_TYPES,
    EverstakeEndpointType,
    SupportedNetworkSymbol,
    ValidatorsQueue,
    getStakingSymbols,
} from './stakeTypes';

const STAKE_MODULE = '@common/wallet-core/stake';

export const fetchEverstakeData = createThunk<
    ValidatorsQueue | { ethApy: number; nextRewardPayout: number },
    {
        networkSymbol: SupportedNetworkSymbol;
        endpointType: EverstakeEndpointType;
    },
    { rejectValue: string }
>(`${STAKE_MODULE}/fetchEverstakeData`, async (params, { fulfillWithValue, rejectWithValue }) => {
    const { networkSymbol, endpointType } = params;

    const endpointSuffix = EVERSTAKE_ENDPOINT_TYPES[endpointType];
    const endpointPrefix = EVERSTAKE_ENDPOINT_PREFIX[networkSymbol];

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

export const initStakeDataThunk = createThunk(
    `${STAKE_MODULE}/initStakeDataThunk`,
    (_, { getState, dispatch, extra }) => {
        const enabledNetworks = extra.selectors.selectEnabledNetworks(getState());

        const ethereumBasedNetworksWithStaking = getStakingSymbols(enabledNetworks);

        const promises = ethereumBasedNetworksWithStaking.flatMap(networkSymbol =>
            Object.values(EverstakeEndpointType).map(endpointType => {
                const data = selectEverstakeData(getState(), networkSymbol, endpointType);

                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

                const shouldRefetch =
                    data?.error ||
                    !data?.lastSuccessfulFetchTimestamp ||
                    data?.lastSuccessfulFetchTimestamp <= fiveMinutesAgo;

                if (shouldRefetch) {
                    return dispatch(fetchEverstakeData({ networkSymbol, endpointType }));
                }

                return null;
            }),
        );

        return Promise.all(promises);
    },
);

let stakeDataTimeout: Timeout | null = null;

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
