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
    token?: TokenInfo,
    isNewAccount?: boolean,
    userCallDataHex?: string,
): PrecomposedTransaction => {
    if (token) {
        return calculateTrc20Transfer(
            availableBalance,
            output,
            feeLevel,
            token,
            networkSymbol,
            bytes,
        );
    }
    if (userCallDataHex) {
        return calculateRawContractCall(availableBalance, output, feeLevel, networkSymbol, bytes);
    }

    return calculateTrxTransfer(availableBalance, output, feeLevel, isNewAccount ?? false, bytes);
};
