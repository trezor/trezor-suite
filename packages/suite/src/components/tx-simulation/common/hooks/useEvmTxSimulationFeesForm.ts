import { useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { type TxSimulationEVMResult } from '@suite-common/tx-simulation';
import {
    type NetworkSymbol,
    type NetworkType,
    asNetworkSymbol,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { type EvmSelectedFee, type FeeLevelLabel } from '@suite-common/wallet-types';
import {
    fromGwei,
    fromIntegerString,
    getConvertedOrDefaultFeeInfo,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite';
import { useComposedLevelsPlaceholder } from '#src/hooks/wallet/form/useComposedLevelsPlaceholder';
import { useCustomFeeValidation } from '#src/hooks/wallet/form/useCustomFeeValidation';
import { type FeesFormValues, useFees } from '#src/hooks/wallet/form/useFees';

// Dapps and the yield builder pass the gas limit as a hex quantity; the gas limit input takes decimals.
const toDecimalGasLimit = (gasLimit: string) => {
    const gasLimitBig = new BigNumber(gasLimit);

    return gasLimitBig.isFinite() ? gasLimitBig.toFixed() : gasLimit;
};

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
    isGasLimitFinal?: boolean;
}

export function useEvmTxSimulationFeesForm({
    accountBalance,
    networkType = 'ethereum',
    networkSymbol = asNetworkSymbol('eth'),
    defaultGasLimit: rawDefaultGasLimit = ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
    txValue = '0',
    isGasLimitFinal = false,
}: UseTxFeesFormProps) {
    const defaultGasLimit = toDecimalGasLimit(rawDefaultGasLimit);
    const form = useForm<FeesFormValues>({
        mode: 'onChange',
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
    // Keep `formState` as its own binding: the spread object is a react-hook-form ref that never
    // changes identity, so without it the React Compiler caches this argument once and `useFees`
    // reads validation errors frozen at their first-render value.
    const { formState } = form;
    const { changeFeeLevel } = useFees({
        ...form,
        formState,
        defaultValue: 'normal',
        feeInfo,
    });

    const [selectedFee, feePerUnit, maxFeePerGas, feeLimit, estimatedFeeLimit] = useWatch({
        control: form.control,
        name: ['selectedFee', 'feePerUnit', 'maxFeePerGas', 'feeLimit', 'estimatedFeeLimit'],
    });

    const { hasCustomFeeErrors, validateCustomFee } = useCustomFeeValidation(form);

    // The custom gas limit field keeps its value after leaving Custom, so only Custom may use it.
    const feeTotalCalculation = useCallback(
        (feeValue: string, label: FeeLevelLabel) =>
            new BigNumber(feeValue)
                .multipliedBy(1e9)
                .multipliedBy(label === 'custom' ? feeLimit : estimatedFeeLimit || defaultGasLimit)
                .toString(),
        [feeLimit, estimatedFeeLimit, defaultGasLimit],
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

    function handleTxSimulationResult({
        simulation,
        gas_estimation,
        isChainSupported,
    }: TxSimulationEVMResult) {
        if (isGasLimitFinal) {
            return;
        }

        const newFeeLimit =
            isChainSupported && gas_estimation?.status === 'Success'
                ? Number(gas_estimation.estimate).toString()
                : null;

        if (simulation?.status === 'Success' && newFeeLimit && newFeeLimit !== defaultGasLimit) {
            form.setValue('feeLimit', newFeeLimit);
            form.setValue('estimatedFeeLimit', newFeeLimit);
        }
    }

    function getSelectedFee(): EvmSelectedFee | null {
        const values = form.getValues();
        const isCustom = values.selectedFee === 'custom';
        // The synthetic 'custom' level has no fee values; read network-derived values from 'normal' instead.
        const referenceLevelLabel = isCustom ? 'normal' : (values.selectedFee ?? 'normal');
        const selectedFeeInfo = feeInfo.levels.find(level => level.label === referenceLevelLabel);
        // Custom fields keep their values after switching to a preset, so a preset reads only its level.
        const gasLimit = isCustom ? values.feeLimit : values.estimatedFeeLimit || defaultGasLimit;

        const eip1559payload = isCustom
            ? {
                  maxFeePerGas: values.maxFeePerGas ?? selectedFeeInfo?.maxFeePerGas,
                  maxPriorityFeePerGas:
                      values.maxPriorityFeePerGas ?? selectedFeeInfo?.maxPriorityFeePerGas,
                  baseFeePerGas: selectedFeeInfo?.baseFeePerGas,
              }
            : {
                  maxFeePerGas: selectedFeeInfo?.maxFeePerGas,
                  maxPriorityFeePerGas: selectedFeeInfo?.maxPriorityFeePerGas,
                  baseFeePerGas: selectedFeeInfo?.baseFeePerGas,
              };

        if (
            eip1559payload.maxFeePerGas &&
            eip1559payload.maxPriorityFeePerGas &&
            eip1559payload.baseFeePerGas
        ) {
            return {
                type: 'eip1559',
                gasLimit: fromIntegerString(gasLimit).toHex(),
                maxFeePerGas: fromGwei(eip1559payload.maxFeePerGas).toWei('hex'),
                maxPriorityFeePerGas: fromGwei(eip1559payload.maxPriorityFeePerGas).toWei('hex'),
                baseFeePerGas: fromGwei(eip1559payload.baseFeePerGas).toWei('hex'),
            };
        }

        const gasPrice = isCustom
            ? (values.feePerUnit ?? selectedFeeInfo?.feePerUnit)
            : selectedFeeInfo?.feePerUnit;

        if (gasPrice) {
            return {
                type: 'legacy',
                gasLimit: fromIntegerString(gasLimit).toHex(),
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
        hasCustomFeeErrors,
        validateCustomFee,
        handleTxSimulationResult,
        getSelectedFee,
    };
}
