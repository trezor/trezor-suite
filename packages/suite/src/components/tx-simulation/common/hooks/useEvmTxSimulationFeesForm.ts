import { useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useSelector } from '@suite-common/redux-utils';
import { type TxSimulationEVMResult } from '@suite-common/tx-simulation';
import {
    type NetworkSymbol,
    type NetworkType,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { type EvmSelectedFee } from '@suite-common/wallet-types';
import {
    fromGwei,
    fromIntegerString,
    getConvertedOrDefaultFeeInfo,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useComposedLevelsPlaceholder } from 'src/hooks/wallet/form/useComposedLevelsPlaceholder';
import { type FeesFormValues, useFees } from 'src/hooks/wallet/form/useFees';

interface UseTxFeesFormProps {
    accountBalance: string;
    networkType?: NetworkType;
    networkSymbol?: NetworkSymbol;
    defaultGasLimit?: string;
    /**
     * Native value the transaction sends, in wei. A payable call such as a WETH wrap spends it on
     * top of the fee, so leaving it out lets a full-balance wrap pass validation and then fail on
     * broadcast with "insufficient funds".
     */
    txValue?: string;
}

export function useEvmTxSimulationFeesForm({
    accountBalance,
    networkType = 'ethereum',
    networkSymbol = 'eth',
    defaultGasLimit = ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    txValue = '0',
}: UseTxFeesFormProps) {
    const form = useForm<FeesFormValues>({
        defaultValues: {
            feeLimit: defaultGasLimit,
            estimatedFeeLimit: defaultGasLimit,
            outputs: [],
        },
    });
    const networkFees = useSelector(state => selectRawNetworkFeeInfo(state, networkSymbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({
                networkType,
                feeInfo: networkFees,
            }),
        [networkType, networkFees],
    );
    const { changeFeeLevel } = useFees({
        ...form,
        defaultValue: 'normal',
        feeInfo,
    });

    const [selectedFee, feePerUnit, maxFeePerGas, feeLimit] = useWatch({
        control: form.control,
        name: ['selectedFee', 'feePerUnit', 'maxFeePerGas', 'feeLimit'],
    });

    // calculate levels with total max fee
    const feeTotalCalculation = useCallback(
        (feeValue: string) =>
            new BigNumber(feeValue).multipliedBy(1e9).multipliedBy(feeLimit).toString(),
        [feeLimit],
    );
    const composedLevels = useComposedLevelsPlaceholder({
        feeTotalCalculation,
        feeInfo,
        selectedFee,
        feePerUnit,
        maxFeePerGas,
    });

    const composedLevelsError = useMemo(() => {
        const selectedLevel = composedLevels[selectedFee || 'normal'];
        const fee = selectedLevel?.type === 'final' ? selectedLevel.fee : undefined;

        if (!fee) return undefined;

        if (new BigNumber(fee).gt(accountBalance)) {
            return {
                id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
                values: { networkDisplaySymbol: getNetworkDisplaySymbol(networkSymbol) },
            } as const;
        }

        if (new BigNumber(fee).plus(txValue).gt(accountBalance)) {
            return { id: 'AMOUNT_IS_NOT_ENOUGH', values: undefined } as const;
        }

        return undefined;
    }, [accountBalance, composedLevels, networkSymbol, selectedFee, txValue]);

    function handleTxSimulationResult({ simulation, gas_estimation }: TxSimulationEVMResult) {
        const newFeeLimit =
            gas_estimation?.status === 'Success'
                ? Number(gas_estimation.estimate).toString()
                : null;

        if (simulation?.status === 'Success' && newFeeLimit && newFeeLimit !== defaultGasLimit) {
            form.setValue('feeLimit', newFeeLimit);
            form.setValue('estimatedFeeLimit', newFeeLimit);
        }
    }

    function getSelectedFee(): EvmSelectedFee | null {
        const values = form.getValues();
        // The synthetic 'custom' level has no fee values; read network-derived values from 'normal' instead.
        const referenceLevelLabel =
            values.selectedFee === 'custom' ? 'normal' : (values.selectedFee ?? 'normal');
        const selectedFeeInfo = feeInfo.levels.find(level => level.label === referenceLevelLabel);

        const eip1559payload = {
            maxFeePerGas: values.maxFeePerGas ?? selectedFeeInfo?.maxFeePerGas,
            maxPriorityFeePerGas:
                values.maxPriorityFeePerGas ?? selectedFeeInfo?.maxPriorityFeePerGas,
            baseFeePerGas: selectedFeeInfo?.baseFeePerGas,
        };

        if (
            eip1559payload.maxFeePerGas &&
            eip1559payload.maxPriorityFeePerGas &&
            eip1559payload.baseFeePerGas
        ) {
            return {
                type: 'eip1559',
                gasLimit: fromIntegerString(values.feeLimit).toHex(),
                maxFeePerGas: fromGwei(eip1559payload.maxFeePerGas).toWei('hex'),
                maxPriorityFeePerGas: fromGwei(eip1559payload.maxPriorityFeePerGas).toWei('hex'),
                baseFeePerGas: fromGwei(eip1559payload.baseFeePerGas).toWei('hex'),
            };
        }

        const gasPrice = values.feePerUnit ?? selectedFeeInfo?.feePerUnit;

        if (gasPrice) {
            return {
                type: 'legacy',
                gasLimit: fromIntegerString(values.feeLimit).toHex(),
                gasPrice: fromGwei(gasPrice).toWei('hex'),
            };
        }

        return null;
    }

    return {
        form,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        composedLevelsError,
        handleTxSimulationResult,
        getSelectedFee,
    };
}
