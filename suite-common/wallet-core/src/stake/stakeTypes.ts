import { NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';

import { StakeState } from './stakeReducer';

// Used when Everstake pool stats are not available from the API.
export const BACKUP_ETH_APY = 4.13;

export const supportedNetworkSymbols = ['eth', 'thol'] as const;

export type SupportedNetworkSymbol = (typeof supportedNetworkSymbols)[number];

export function isSupportedNetworkSymbol(
    networkSymbols: NetworkSymbol,
): networkSymbols is SupportedNetworkSymbol {
    return (supportedNetworkSymbols as readonly string[]).includes(networkSymbols);
}

export const getStakingSymbols = (networkSymbols: NetworkSymbol[]) =>
    networkSymbols.reduce((acc, networkSymbol) => {
        if (
            isSupportedNetworkSymbol(networkSymbol) &&
            getNetworkFeatures(networkSymbol).includes('staking')
        ) {
            acc.push(networkSymbol);
        }

        return acc;
    }, [] as SupportedNetworkSymbol[]);

export const EVERSTAKE_ENDPOINT_PREFIX: Record<SupportedNetworkSymbol, string> = {
    eth: 'https://eth-api-b2c.everstake.one/api/v1',
    thol: 'https://eth-api-b2c-stage.everstake.one/api/v1',
};

export enum EverstakeEndpointType {
    PoolStats = 'poolStats',
    ValidatorsQueue = 'validatorsQueue',
}

export const EVERSTAKE_ENDPOINT_TYPES = {
    [EverstakeEndpointType.PoolStats]: 'stats',
    [EverstakeEndpointType.ValidatorsQueue]: 'validators/queue',
};

export interface ValidatorsQueue {
    validatorsEnteringNum?: number;
    validatorsExitingNum?: number;
    validatorsTotalCount?: number;
    validatorsPerEpoch?: number;
    validatorActivationTime?: number;
    validatorExitTime?: number;
    validatorWithdrawTime?: number;
    validatorAddingDelay?: number;
    updatedAt?: number;
}

export type StakeRootState = { wallet: { stake: StakeState } };
