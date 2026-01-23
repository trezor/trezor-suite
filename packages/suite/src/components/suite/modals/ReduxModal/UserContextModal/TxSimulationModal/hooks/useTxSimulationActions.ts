import { UseFormReturn } from 'react-hook-form';

import { numberToHex, toWei } from 'web3-utils';

import { connectPopupActions } from '@suite-common/connect-popup';
import { FeeInfo } from '@suite-common/wallet-types';
import { ERRORS } from '@trezor/connect';

import { useDispatch } from 'src/hooks/suite';
import { FeesFormValues } from 'src/hooks/wallet/form/useFees';

interface UseTxSimulationActionsProps {
    isEthereumSigningTransaction: boolean;
    form: UseFormReturn<FeesFormValues>;
    feeInfo: FeeInfo;
}

export function useTxSimulationActions({
    isEthereumSigningTransaction,
    form,
    feeInfo,
}: UseTxSimulationActionsProps) {
    const dispatch = useDispatch();

    const confirm = () => {
        if (isEthereumSigningTransaction) {
            const values = form.getValues();
            const selectedFeeInfo = feeInfo.levels.find(
                level => level.label === (values.selectedFee ?? 'normal'),
            );
            const maxFeePerGas = values.maxFeePerGas ?? selectedFeeInfo?.maxFeePerGas;
            const maxPriorityFeePerGas =
                values.maxPriorityFeePerGas ?? selectedFeeInfo?.maxPriorityFeePerGas;
            const gasPrice = values.feePerUnit ?? selectedFeeInfo?.feePerUnit;

            if (maxFeePerGas && maxPriorityFeePerGas) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit: numberToHex(values.feeLimit),
                            gasPrice: undefined,
                            maxFeePerGas: numberToHex(toWei(maxFeePerGas, 'gwei')),
                            maxPriorityFeePerGas: numberToHex(toWei(maxPriorityFeePerGas, 'gwei')),
                        },
                    }),
                );
            } else if (gasPrice) {
                dispatch(
                    connectPopupActions.setSelectedFee({
                        selectedFee: {
                            gasLimit: numberToHex(values.feeLimit),
                            gasPrice: numberToHex(toWei(gasPrice, 'gwei')),
                            maxFeePerGas: undefined,
                            maxPriorityFeePerGas: undefined,
                        },
                    }),
                );
            }
        }

        dispatch(connectPopupActions.approvePermissions());
    };
    const cancel = () => {
        dispatch(connectPopupActions.rejectPermissions(ERRORS.TypedError('Method_Cancel')));
    };

    return {
        confirm,
        cancel,
    } as const;
}
