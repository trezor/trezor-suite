import { useCallback, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { isFulfilled } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@suite-common/react-query';

import { DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type Account,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import type { TokenStandard } from '@trezor/blockchain-link-types';

import { selectRawNetworkFeeInfo } from '../fees/feesReducer';
import { composeNftTransactionThunk } from './composeNftTransactionThunk';

type UseNftFeeComposeParams = {
    account: Account;
    tokenContract: string;
    tokenId: string;
    standard: TokenStandard;
    recipient: string;
    amount: number;
};

export const useNftFeeCompose = ({
    account,
    tokenContract,
    tokenId,
    standard,
    recipient,
    amount,
}: UseNftFeeComposeParams) => {
    const dispatch = useDispatch();

    const { networkType, symbol } = account;
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state as any, symbol));
    const feeInfo = useMemo(
        () => getConvertedOrDefaultFeeInfo({ networkType, feeInfo: rawFeeInfo }),
        [networkType, rawFeeInfo],
    );

    // Minimal form instance — provides FormProvider context required by the Fees component's
    // FieldErrorBanner (which calls useFormState). No validation is wired to this form;
    // all fee-related state lives in the local useState below.
    const methods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: { ...DEFAULT_VALUES, outputs: [], options: ['broadcast'] },
    });

    const [composedLevels, setComposedLevels] = useState<PrecomposedLevels | undefined>(undefined);
    const [selectedFee, setSelectedFee] = useState<FeeLevelLabel>('normal');
    const [customFeeValues, setCustomFeeValues] = useState<
        | {
              feePerUnit: string;
              feeLimit: string;
              maxFeePerGas?: string;
              maxPriorityFeePerGas?: string;
          }
        | undefined
    >(undefined);

    const composeRequestIdRef = useRef(0);

    const { mutate, isPending: isComposing } = useMutation({
        mutationFn: async () => {
            composeRequestIdRef.current += 1;
            const currentRequestId = composeRequestIdRef.current;

            const result = await dispatch(
                composeNftTransactionThunk({
                    account,
                    feeInfo,
                    tokenContract,
                    tokenId,
                    standard,
                    recipient,
                    amount,
                    selectedFee,
                    customFee: customFeeValues,
                }),
            ).then(res => (isFulfilled(res) ? res.payload : undefined));

            if (currentRequestId !== composeRequestIdRef.current) {
                return null;
            }

            return result ?? null;
        },
        onMutate: () => {
            setComposedLevels(undefined);
        },
        onSuccess: result => {
            if (!result) return;
            setComposedLevels(result as PrecomposedLevels);
        },
    });

    const composeRequest = useCallback(() => {
        mutate();
    }, [mutate]);

    const changeFeeLevel = useCallback(
        (level: FeeLevelLabel, custom?: { feePerUnit: string; feeLimit: string; maxFeePerGas?: string; maxPriorityFeePerGas?: string }) => {
            setSelectedFee(level);
            setCustomFeeValues(custom);

            if (level === 'custom' && composedLevels) {
                const prevLevel = composedLevels[selectedFee];
                if (prevLevel) {
                    setComposedLevels({ ...composedLevels, custom: prevLevel });
                }
            }
        },
        [composedLevels, selectedFee],
    );

    const composedTransaction = useMemo((): PrecomposedTransactionFinal | undefined => {
        if (!composedLevels) return undefined;
        const selected = composedLevels[selectedFee];

        return selected?.type === 'final' ? selected : undefined;
    }, [composedLevels, selectedFee]);

    return {
        feeInfo,
        isComposing,
        composedLevels,
        composedTransaction,
        selectedFee,
        composeRequest,
        changeFeeLevel,
        methods,
    };
};
