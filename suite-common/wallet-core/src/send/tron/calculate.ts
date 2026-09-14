import { type NetworkConfigDeps } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { calculateRawContractCall } from './calculateRawContractCall';
import { calculateTrc20Transfer } from './calculateTrc20Transfer';
import { calculateTrxTransfer } from './calculateTrxTransfer';
import { type EstimateFeeLevel } from './types';

export const calculate = (
    networkConfigDeps: NetworkConfigDeps,
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    networkSymbol: NetworkSymbol,
    bytes: number,
    hasMemo: boolean,
    token?: TokenInfo,
    isNewAccount?: boolean,
    userCallDataHex?: string,
): PrecomposedTransaction => {
    if (token) {
        return calculateTrc20Transfer(
            networkConfigDeps,
            availableBalance,
            output,
            feeLevel,
            token,
            networkSymbol,
            bytes,
            hasMemo,
        );
    }
    if (userCallDataHex) {
        return calculateRawContractCall(
            networkConfigDeps,
            availableBalance,
            output,
            feeLevel,
            networkSymbol,
            bytes,
            hasMemo,
        );
    }

    return calculateTrxTransfer(
        availableBalance,
        output,
        feeLevel,
        isNewAccount ?? false,
        bytes,
        hasMemo,
    );
};
