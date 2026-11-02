import { useEffect, useMemo, useState } from 'react';

import { buildClaimCalldata } from '@suite-common/earn-stablecoin';
import { type YieldAccountRewards } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol, getEarnYieldClaimContractAddress } from '@suite-common/wallet-config';
import {
    type YieldEstimatedFeeLevel,
    estimateYieldFeeLevel,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { calculateTotalGasCost, formatNetworkAmount } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

const getClaimCalldata = (accountRewards: YieldAccountRewards | undefined): string | null => {
    if (!accountRewards || accountRewards.rewards.length === 0) {
        return null;
    }

    const { rewards, account } = accountRewards;
    const senderAddress = account.descriptor;

    try {
        return buildClaimCalldata({ senderAddress, rewards });
    } catch {
        return null;
    }
};

type GetEstimatedClaimFeeParams = {
    feeLevel: YieldEstimatedFeeLevel;
    networkSymbol: NetworkSymbol;
};

const getEstimatedClaimFee = ({ feeLevel, networkSymbol }: GetEstimatedClaimFeeParams) => {
    const eip1559MediumFee = feeLevel.eip1559?.medium;

    const feePerGas =
        eip1559MediumFee?.maxFeePerGas && eip1559MediumFee.maxPriorityFeePerGas
            ? eip1559MediumFee.maxFeePerGas
            : feeLevel.feePerUnit;

    return formatNetworkAmount(calculateTotalGasCost(feePerGas, feeLevel.feeLimit), networkSymbol);
};

type ClaimFeeEstimateState = {
    requestKey: string;
    fee: string | null;
};

type YieldClaimFeeEstimate = {
    fee: string | null;
};

type UseYieldClaimFeeEstimateParams = {
    accountRewards: YieldAccountRewards | undefined;
    isEnabled: boolean;
};

export const useYieldClaimFeeEstimate = ({
    accountRewards,
    isEnabled,
}: UseYieldClaimFeeEstimateParams): YieldClaimFeeEstimate => {
    const account = accountRewards?.account;
    const networkSymbol = account?.symbol;
    const senderAddress = account?.descriptor;
    const identity = account?.deviceState;
    const contractAddress = networkSymbol
        ? getEarnYieldClaimContractAddress(networkSymbol)
        : undefined;

    const feeInfoBlockHeight = useSelector(
        state => selectRawNetworkFeeInfo(state, networkSymbol)?.blockHeight ?? 0,
    );

    const [estimate, setEstimate] = useState<ClaimFeeEstimateState | null>(null);

    const claimCalldata = useMemo(() => getClaimCalldata(accountRewards), [accountRewards]);

    const requestKey =
        isEnabled && networkSymbol && senderAddress && contractAddress && claimCalldata
            ? [networkSymbol, senderAddress, contractAddress, claimCalldata].join('|')
            : null;

    const estimateKey = requestKey === null ? null : `${requestKey}|${feeInfoBlockHeight}`;

    useEffect(() => {
        if (estimateKey === null || requestKey === null) return;
        if (!networkSymbol || !senderAddress || !contractAddress || !claimCalldata) return;

        let isStale = false;

        const applyEstimate = (fee: string | null) => {
            if (isStale) return;
            setEstimate({ requestKey, fee });
        };

        estimateYieldFeeLevel({
            coin: networkSymbol,
            identity,
            from: senderAddress,
            to: contractAddress,
            data: claimCalldata,
        }).then(
            result => {
                if (!result.success) return null;

                const estimatedClaimFee = getEstimatedClaimFee({
                    feeLevel: result.payload,
                    networkSymbol,
                });

                return applyEstimate(estimatedClaimFee);
            },
            () => applyEstimate(null),
        );

        return () => {
            isStale = true;
        };
    }, [
        estimateKey,
        requestKey,
        networkSymbol,
        senderAddress,
        identity,
        contractAddress,
        claimCalldata,
    ]);

    const currentEstimate =
        estimate !== null && estimate.requestKey === requestKey ? estimate : null;

    const fee = currentEstimate?.fee ?? null;

    return { fee };
};
