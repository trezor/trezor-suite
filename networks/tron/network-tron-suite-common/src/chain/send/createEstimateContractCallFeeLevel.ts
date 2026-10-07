import type { GetTrezorConnectDep } from '@trezor/connect-common';
import { toCoinSymbol } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { type EstimateFeeLevel } from './types';

export type EstimateContractCallFeeLevelDeps = GetTrezorConnectDep<'blockchainEstimateFee'>;

type ContractCallFeeResult = EstimateFeeLevel | { error: string };

export type EstimateContractCallFeeLevelParams = {
    symbol: NetworkSymbol;
    identity: string | undefined;
    from: string;
    to: string;
    data: string;
};

export type EstimateContractCallFeeLevel = (
    params: EstimateContractCallFeeLevelParams,
) => Promise<ContractCallFeeResult>;

/** The energy a contract call needs, priced by the backend. */
export const createEstimateContractCallFeeLevel =
    (deps: EstimateContractCallFeeLevelDeps): EstimateContractCallFeeLevel =>
    async params => {
        const estimatedFee = await deps.getTrezorConnect().blockchainEstimateFee({
            coin: toCoinSymbol(params.symbol),
            identity: params.identity,
            request: {
                blocks: [1],
                specific: {
                    from: params.from,
                    to: params.to,
                    value: '0x0',
                    data: `0x${params.data}`,
                },
            },
        });

        if (!estimatedFee.success) {
            return { error: estimatedFee.error.message };
        }

        const [firstLevel] = estimatedFee.payload.levels;

        if (!firstLevel) {
            return { error: 'No fee level returned from backend.' };
        }

        return firstLevel;
    };
