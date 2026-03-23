import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';
import { useComposedLevelsPlaceholder } from 'src/hooks/wallet/form/useComposedLevelsPlaceholder';
import { type FeesFormValues, useFees } from 'src/hooks/wallet/form/useFees';

interface UseTxFeesFormProps {
    networkType?: NetworkType;
    networkSymbol?: NetworkSymbol;
    defaultGasLimit?: string;
}

export function useTxFeesForm({
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
        composeRequest: () => {},
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

    return {
        form,
        changeFeeLevel,
        feeInfo,
        defaultGasLimit,
        composedLevels,
    };
}
