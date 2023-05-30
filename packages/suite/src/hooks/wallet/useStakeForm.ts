import { TypedValidationRules } from '@wallet-types/form';
import { PrecomposedLevels, FeeInfo } from '@wallet-types/sendForm';
import type { Account, Network } from '@wallet-types';
import type { FeeLevel } from '@trezor/connect';
import { useContext, createContext, useEffect, useMemo, useCallback, useState } from 'react';
import { UseFormMethods, FormState as ReactHookFormState, useForm } from 'react-hook-form';
import { WithSelectedAccountLoadedProps } from '@wallet-components';
import { useFees } from './form/useFees';
import { useCompose } from './form/useCompose';
import { useSelector } from '@suite-hooks';
import { getFeeLevels } from '@suite-common/wallet-utils';
import { DEFAULT_PAYMENT } from '@suite-common/wallet-constants';

import type { FormState } from '@wallet-types/sendForm';

export type StakeFormState = Pick<
    FormState,
    'feeLimit' | 'feePerUnit' | 'selectedFee' | 'outputs' | 'setMaxOutputId'
>;

export type StakeFormContextValues = Omit<UseFormMethods<StakeFormState>, 'register'> & {
    register: (rules?: TypedValidationRules) => (ref: any) => void;
    onSubmit: () => void;
    account: Account;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    composeRequest: (field?: string) => void;
    composedLevels?: PrecomposedLevels;
    network: Network;
    feeInfo: FeeInfo;
    handleClearFormButtonClick: () => void;
    formState: ReactHookFormState<FormState>;
    defaultValues: StakeFormState;
    setMax: (active: boolean) => void;
};

const defaultValues = {
    feePerUnit: '',
    feeLimit: '',
    estimatedFeeLimit: undefined,
    setMaxOutputId: undefined,
    outputs: [
        {
            ...DEFAULT_PAYMENT,
            address: '0x728f2548559E2AaCAE8B6b01FC39fF72771FF8BE', // TODO: remove Metr Pára
        },
    ],
};

const OUTPUT_AMOUNT_FIELD = 'outputs[0].amount';

type UseStakeFormProps = WithSelectedAccountLoadedProps;

export const StakeFormContext = createContext<StakeFormContextValues | null>(null);
StakeFormContext.displayName = 'StakeFormContext';

export const useStakeForm = ({ selectedAccount }: UseStakeFormProps): StakeFormContextValues => {
    const fees = useSelector(state => state.wallet.fees);
    const { account, network } = selectedAccount;
    const { symbol, networkType } = account;
    const coinFees = fees[symbol];
    const levels = getFeeLevels(networkType, coinFees);
    const feeInfo = useMemo(() => ({ ...coinFees, levels }), [coinFees, levels]);

    const methods = useForm<StakeFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const {
        reset,
        register,
        unregister,
        setValue,
        getValues,
        setError,
        clearErrors,
        control,
        formState,
    } = methods;

    useEffect(() => {
        register('outputs'); // used only '0' index, required to be able to use useCompose methods
        register('setMaxOutputId');
        return () => {
            unregister('outputs');
            unregister('setMaxOutputId');
        };
    }, [register, unregister]);

    // Has to be here to avoid endless loop of compose in useCompose hook
    const [state] = useState({
        account,
        network,
        feeInfo,
    });

    const { composeRequest, composedLevels, onFeeLevelChange } = useCompose({
        ...methods,
        state,
    });

    const { changeFeeLevel, selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });

    // copied to make set max work, refactor, check shouldDirty thingy
    useEffect(() => {
        if (!composedLevels) return;

        const { setMaxOutputId } = getValues();
        const selectedFeeLevel = selectedFee || 'normal';
        const composed = composedLevels[selectedFeeLevel];

        if (!composed) return;

        if (composed.type === 'error' && composed.errorMessage) {
            setError(OUTPUT_AMOUNT_FIELD, {
                type: 'compose',
                message: composed.errorMessage as any,
            });
        } else if (composed.type === 'final') {
            // set calculated and formatted "max" value to 'Amount' input
            if (typeof setMaxOutputId === 'number' && composed.max) {
                setValue(OUTPUT_AMOUNT_FIELD, composed.max, {
                    shouldValidate: true,
                    shouldDirty: true,
                });
                clearErrors(OUTPUT_AMOUNT_FIELD);
            }
            setValue('estimatedFeeLimit', composed.estimatedFeeLimit, { shouldDirty: true });
        }
    }, [clearErrors, composedLevels, getValues, setError, setValue, selectedFee]);

    const setMax = useCallback(
        (active: boolean) => {
            clearErrors([OUTPUT_AMOUNT_FIELD]);
            setValue('setMaxOutputId', active ? 0 : undefined);
            composeRequest();
        },
        [clearErrors, setValue, composeRequest],
    );

    const handleClearFormButtonClick = useCallback(() => {
        reset(defaultValues);
        composeRequest();
    }, [reset, composeRequest]);

    const onSubmit = () => {};

    return {
        register: register as (rules?: TypedValidationRules) => (ref: any) => void,
        control,
        onSubmit,
        account,
        changeFeeLevel,
        composeRequest,
        composedLevels,
        network,
        feeInfo,
        handleClearFormButtonClick,
        formState,
        defaultValues,
        setMax,
        getValues,
    };
};

export const useStakeFormContext = () => {
    const context = useContext(StakeFormContext);
    if (context === null) throw Error('StakeFormContext used without Context');
    return context;
};
