import { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { DEFAULT_PAYMENT, DEFAULT_OPTIONS, DEFAULT_VALUES } from '@wallet-constants/sendForm';
import { FormState, SendContextProps, SendContextState, Output } from '@wallet-types/sendForm';
import { useSendFormOutputs } from './useSendFormOutputs';
import { useSendFormFields } from './useSendFormFields';
import { useSendFormCompose } from './useSendFormCompose';

export const SendContext = createContext<SendContextState | null>(null);
SendContext.displayName = 'SendContext';

const getDefaultValues = (currency: Output['currency']) => {
    return {
        ...DEFAULT_VALUES,
        options: [...DEFAULT_OPTIONS],
        outputs: [{ ...DEFAULT_PAYMENT, currency }],
    };
};

// Mounted in top level index: @wallet-views/send
// returned ContextState is a object provided as SendContext values with custom callbacks for updating/resetting state
export const useSendForm = (props: SendContextProps): SendContextState => {
    // public variables, exported to SendFormContext
    const [state, setState] = useState(props);

    // private variables, used inside sendForm hook
    const draft = useRef<FormState | undefined>(undefined);
    const { getDraft, saveDraft, removeDraft, signTransaction } = useActions({
        getDraft: sendFormActions.getDraft,
        saveDraft: sendFormActions.saveDraft,
        removeDraft: sendFormActions.removeDraft,
        signTransaction: sendFormActions.signTransaction,
    });

    const { localCurrencyOption } = state;

    // register `react-hook-form`, default values are set later in "loadDraft" useEffect block
    const useFormMethods = useForm<FormState>({ mode: 'onChange' });

    const { control, reset, register, getValues } = useFormMethods;

    // register array fields (outputs array in react-hook-form)
    const outputsFieldArray = useFieldArray<Output>({
        control,
        name: 'outputs',
    });

    // load draft from reducer
    // TODO: load "remembered" fee level
    useEffect(() => {
        const stored = getDraft();
        const formState = stored ? stored.formState : {};
        const values = {
            ...getDefaultValues(localCurrencyOption),
            ...formState,
        };
        reset(values);

        if (stored) {
            draft.current = stored.formState;
        }
    }, [localCurrencyOption, getDraft, getValues, reset]);

    // register custom form fields (without HTMLElement)
    useEffect(() => {
        register({ name: 'setMaxOutputId', type: 'custom' });
        register({ name: 'selectedFee', type: 'custom' });
        register({ name: 'options', type: 'custom' });
    }, [register]);

    // update custom values
    const updateContext = useCallback(
        (value: Partial<SendContextProps>) => {
            setState({
                ...state,
                ...value,
            });
            console.warn('updateContext', value, state);
        },
        [state],
    );

    const sendFormUtils = useSendFormFields({
        ...useFormMethods,
        fiatRates: state.fiatRates,
    });

    const {
        composeDraft,
        draftSaveRequest,
        setDraftSaveRequest,
        composeRequest,
        composedLevels,
        setComposedLevels,
    } = useSendFormCompose({
        ...useFormMethods,
        state,
        updateContext,
        setAmount: sendFormUtils.setAmount,
    });

    const sendFormOutputs = useSendFormOutputs({
        ...useFormMethods,
        outputsFieldArray,
        localCurrencyOption,
        composeRequest,
    });

    const resetContext = useCallback(() => {
        setComposedLevels(undefined);
        removeDraft();
        setState(props); // resetting state will trigger "load draft" hook which will reset FormState
    }, [props, removeDraft, setComposedLevels]);

    // handle draft change
    useEffect(() => {
        if (!draft.current) return;
        composeDraft(draft.current);
        draft.current = undefined;
    }, [draft, composeDraft]);

    useEffect(() => {
        if (!draftSaveRequest) return;
        saveDraft(getValues());
        setDraftSaveRequest(false);
    }, [draftSaveRequest, setDraftSaveRequest, saveDraft, getValues]);

    const sign = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels
            ? composedLevels[values.selectedFee || 'normal']
            : undefined;
        if (composedTx && composedTx.type === 'final') {
            // sign workflow in Actions:
            // signTransaction > sign[COIN]Transaction > requestPushTransaction (modal with promise decision)
            const result = await signTransaction(values, composedTx);
            if (result) {
                resetContext();
            }
        }
    }, [getValues, composedLevels, signTransaction, resetContext]);

    return {
        ...state,
        ...useFormMethods,
        outputs: outputsFieldArray.fields,
        composedLevels,
        updateContext,
        resetContext,
        composeTransaction: composeRequest,
        signTransaction: sign,
        ...sendFormUtils,
        ...sendFormOutputs,
    };
};

// Used across send form components
// Provide combined context of `react-hook-form` with custom values as SendContextState
export const useSendFormContext = () => {
    const ctx = useContext(SendContext);
    if (ctx === null) throw Error('useSendFormContext used without Context');
    return ctx;
};
