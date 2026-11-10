import { useEffect, useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type FeeInfo,
    type FormState,
    type GeneralPrecomposedTransaction,
} from '@suite-common/wallet-types';

import { TradingExchangeNetworkFeeModalLayout } from './TradingExchangeNetworkFeeModalLayout';
import { useFeesContextValue } from '../../../../../components/wallet/Fees/context/useFeesContextValue';
import { useCompose } from '../../../../../hooks/wallet/form/useCompose';
import { useFees } from '../../../../../hooks/wallet/form/useFees';

export type TradingExchangeNetworkFeeModalProps = {
    account: Account;
    feeInfo: FeeInfo;
    composeFormState: FormState;
    assumeNewAccount?: boolean;
    onConfirm: (composedTransactionInfo: TradingComposedTransactionInfo) => void;
    onClose: () => void;
};

type ComposedFeeLevel = Exclude<GeneralPrecomposedTransaction, { type: 'error' }>;

const isComposedFeeLevel = (
    level: GeneralPrecomposedTransaction | undefined,
): level is ComposedFeeLevel => level?.type === 'final' || level?.type === 'nonfinal';

export const TradingExchangeNetworkFeeModal = ({
    account,
    feeInfo,
    composeFormState,
    assumeNewAccount,
    onConfirm,
    onClose,
}: TradingExchangeNetworkFeeModalProps) => {
    const form = useForm<FormState>({ mode: 'onChange', defaultValues: composeFormState });

    const composeContext = useMemo(
        () => ({ account, network: getNetwork(account.symbol), feeInfo, assumeNewAccount }),
        [account, feeInfo, assumeNewAccount],
    );

    const { composedLevels, composeRequest, onFeeLevelChange, isLoading } = useCompose({
        ...form,
        state: composeContext,
        defaultField: 'selectedFee',
    });

    const { changeFeeLevel } = useFees({
        ...form,
        defaultValue: composeFormState.selectedFee ?? 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        composedLevels,
    });

    const fees = useFeesContextValue({
        account,
        control: form.control,
        feeInfo,
        composedLevels,
        changeFeeLevel,
        isComposing: isLoading,
    });

    useEffect(() => {
        composeRequest('selectedFee');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feeInfo]);

    const composedLevel = composedLevels?.[fees.selectedFee];
    const isConfirmDisabled = isLoading || !isComposedFeeLevel(composedLevel);

    const onConfirmClick = () => {
        if (!isComposedFeeLevel(composedLevel)) {
            return;
        }

        onConfirm({
            selectedFee: fees.selectedFee,
            composed: composedLevel,
        });
        onClose();
    };

    return (
        <FormProvider {...form}>
            <TradingExchangeNetworkFeeModalLayout
                account={account}
                fees={fees}
                isConfirmDisabled={isConfirmDisabled}
                onConfirm={onConfirmClick}
                onClose={onClose}
            />
        </FormProvider>
    );
};
