import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { numberToHex, toWei } from 'web3-utils';

import { type TxSimulationEVMResult } from '@suite-common/tx-simulation';
import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useComposedLevelsPlaceholder } from 'src/hooks/wallet/form/useComposedLevelsPlaceholder';
import { type FeesFormValues, useFees } from 'src/hooks/wallet/form/useFees';

type SelectedFee =
    | {
          gasPrice: undefined;
          maxFeePerGas: string;
          maxPriorityFeePerGas: string;
          gasLimit: string;
      }
    | {
          gasPrice: string;
          maxFeePerGas: undefined;
          maxPriorityFeePerGas: undefined;
          gasLimit: string;
      };

interface UseTxFeesFormProps {
    networkType?: NetworkType;
    networkSymbol?: NetworkSymbol;
    defaultGasLimit?: string;
}

export function useEvmTxSimulationFeesForm({
    networkType = 'ethereum',
    networkSymbol = 'eth',
    defaultGasLimit = ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
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

    const { watch } = form;
    const selectedFee = watch('selectedFee');
    const feePerUnit = watch('feePerUnit');
    const maxFeePerGas = watch('maxFeePerGas');
    const feeLimit = watch('feeLimit');

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

    function getSelectedFee(): SelectedFee | undefined {
        const values = form.getValues();
        const selectedFeeInfo = feeInfo.levels.find(
            level => level.label === (values.selectedFee ?? 'normal'),
        );
        const maxFeePerGas = values.maxFeePerGas ?? selectedFeeInfo?.maxFeePerGas;
        const maxPriorityFeePerGas =
            values.maxPriorityFeePerGas ?? selectedFeeInfo?.maxPriorityFeePerGas;
        const gasPrice = values.feePerUnit ?? selectedFeeInfo?.feePerUnit;

        if (maxFeePerGas && maxPriorityFeePerGas) {
            return {
                gasLimit: numberToHex(values.feeLimit),
                gasPrice: undefined,
                maxFeePerGas: numberToHex(toWei(maxFeePerGas, 'gwei')),
                maxPriorityFeePerGas: numberToHex(toWei(maxPriorityFeePerGas, 'gwei')),
            };
        }

        if (gasPrice) {
            return {
                gasLimit: numberToHex(values.feeLimit),
                gasPrice: numberToHex(toWei(gasPrice, 'gwei')),
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
            };
        }
    }

    return {
        form,
        changeFeeLevel,
        feeInfo,
        composedLevels,
        handleTxSimulationResult,
        getSelectedFee,
    };
}
