import { U_INT_32 } from '@suite-common/wallet-constants';

import { type TxSimulationEVMResult } from '../types';

const GAS_ESTIMATE_REGEX = /^(0x[0-9a-f]+|[0-9]+)$/i;

/**
 * Returns the gas estimate of an EVM simulation as a hex gas limit, the format that Connect reads.
 * Returns null if the estimation failed or the estimate is not valid.
 */
export const getGasLimitFromGasEstimation = (
    gasEstimation: TxSimulationEVMResult['gas_estimation'],
): string | null => {
    if (gasEstimation?.status !== 'Success' || !GAS_ESTIMATE_REGEX.test(gasEstimation.estimate)) {
        return null;
    }
    const gasLimit = BigInt(gasEstimation.estimate);

    // The simulation runs with a gas limit of U_INT_32, so a larger estimate is not valid.
    return gasLimit > 0n && gasLimit <= BigInt(U_INT_32) ? `0x${gasLimit.toString(16)}` : null;
};
