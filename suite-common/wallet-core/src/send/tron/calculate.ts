import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type ExternalOutput, type PrecomposedTransaction } from '@suite-common/wallet-types';
import { type TokenInfo } from '@trezor/connect';

import { calculateRawContractCall } from './calculateRawContractCall';
import { calculateTrc20Transfer } from './calculateTrc20Transfer';
import { calculateTrxTransfer } from './calculateTrxTransfer';
import { type EstimateFeeLevel } from './types';

export const calculate = (
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
    if (userCallDataHex) {
        return calculateRawContractCall(
            availableBalance,
            output,
            feeLevel,
            networkSymbol,
            bytes,
            hasMemo,
        );
    }
    if (token) {
        return calculateTrc20Transfer(
            availableBalance,
            output,
            feeLevel,
            token,
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
