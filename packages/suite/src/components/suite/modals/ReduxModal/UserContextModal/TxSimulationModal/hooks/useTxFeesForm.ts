import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { FeesFormValues, useFees } from 'src/hooks/wallet/form/useFees';

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

    return {
        form,
        changeFeeLevel,
        feeInfo,
        defaultGasLimit,
    };
}
