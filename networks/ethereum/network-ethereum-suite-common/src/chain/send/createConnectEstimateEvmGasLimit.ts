import type { GetTrezorConnectDep } from '@trezor/connect-common';
import { toCoinSymbol } from '@trezor/network-module-suite-common-types';

import type { EstimateEvmGasLimit } from './types';

export type ConnectEstimateEvmGasLimitDeps = GetTrezorConnectDep<'blockchainEstimateFee'>;

export type ConnectEstimateEvmGasLimit = EstimateEvmGasLimit;

/** Gas estimated by the backend Connect is connected to, on the account's connection. */
export const createConnectEstimateEvmGasLimit =
    (deps: ConnectEstimateEvmGasLimitDeps): ConnectEstimateEvmGasLimit =>
    async ({ account, ...specific }) => {
        const estimatedFee = await deps.getTrezorConnect().blockchainEstimateFee({
            coin: toCoinSymbol(account.symbol),
            identity: account.deviceState,
            request: { blocks: [2], specific },
        });

        if (!estimatedFee.success) return { success: false, error: estimatedFee.error };

        return { success: true, feeLimit: estimatedFee.payload.levels[0]?.feeLimit };
    };
