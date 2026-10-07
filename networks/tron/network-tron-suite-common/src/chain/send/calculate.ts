import type { TokenInfo } from '@trezor/blockchain-link-types';
import type {
    ExternalOutput,
    PrecomposedTransaction,
} from '@trezor/network-module-suite-common-types';

import { calculateRawContractCall } from './calculateRawContractCall';
import { calculateTrc20Transfer } from './calculateTrc20Transfer';
import { calculateTrxTransfer } from './calculateTrxTransfer';
import { type EstimateFeeLevel } from './types';

export const calculate = (
    availableBalance: string,
    output: ExternalOutput,
    feeLevel: EstimateFeeLevel,
    networkDisplaySymbol: string,
    bytes: number,
    hasMemo: boolean,
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
            networkDisplaySymbol,
            bytes,
            hasMemo,
        );
    }
    if (userCallDataHex) {
        return calculateRawContractCall(
            availableBalance,
            output,
            feeLevel,
            networkDisplaySymbol,
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
