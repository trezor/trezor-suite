import {
    type YieldGasReserve,
    useFetchFeesOnce,
    useYieldGasReserve,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

type UseYieldDepositGasReserveParams = {
    account: Account | null;
    isWrappedNativeVault: boolean;
    tokenContractAddress?: string | null;
    flowKey?: string | null;
    isDisabled?: boolean;
};

export const useYieldDepositGasReserve = ({
    account,
    isWrappedNativeVault,
    tokenContractAddress,
    flowKey,
    isDisabled = false,
}: UseYieldDepositGasReserveParams): YieldGasReserve => {
    const networkSymbol = account?.symbol;
    const flowType = flowKey ? 'deposit' : undefined;

    useFetchFeesOnce({ networkSymbol, isDisabled });

    return useYieldGasReserve({
        networkSymbol,
        isWrappedNativeVault,
        tokenContractAddress,
        flowType,
        flowKey,
    });
};
