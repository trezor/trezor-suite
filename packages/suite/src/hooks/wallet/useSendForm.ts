import { createContext, useContext, useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useFormContext } from 'react-hook-form';
// import { SEND } from '@wallet-actions/constants';
import { useActions } from '@suite-hooks';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { FormState, ContextStateValues, ContextState } from '@wallet-types/sendForm';

export const SendContext = createContext<ContextState | null>(null);
SendContext.displayName = 'SendContext';

// Mounted in top level index: @wallet-views/send
// returned ContextState is a object provided as SendContext values with custom callbacks for updating/resetting state
export const useSendForm = (defaultValues: ContextStateValues) => {
    const [state, setState] = useState(defaultValues);

    const updateContext = useCallback(
        (value: Parameters<ContextState['updateContext']>[0]) => {
            setState({
                ...state,
                ...value,
            });
            console.warn('updateContext', value, state);
        },
        [state],
    );

    const resetContext = useCallback(() => {
        setState(defaultValues);
    }, [defaultValues]);

    return {
        ...state,
        updateContext,
        resetContext,
    };
};

// Used across send form components
// Provide combined FormState from `react-hook-form` and ContextState from `SendContext`
export const useSendFormContext = () => {
    const dispatch = useDispatch();
    const sendContext = useContext(SendContext) as ContextState;
    const formContext = useFormContext<FormState>();
    const { saveDraft, composeTransaction, removeDraft } = useActions({
        removeDraft: sendFormActions.removeDraft,
        saveDraft: sendFormActions.saveDraft,
        composeTransaction: sendFormActions.composeTransactionNew,
    });

    const updateDraft = useCallback(() => {
        saveDraft(formContext.getValues({ nest: true }), sendContext);
    }, [sendContext, formContext, saveDraft]);

    const clearDraft = useCallback(() => {
        removeDraft();
    }, [removeDraft]);

    const compose = useCallback(async () => {
        const result = await composeTransaction(sendContext, formContext.getValues({ nest: true }));
        console.log(result);
        if (result) {
            // save precomposed tx to reducer
            // dispatch({ type: SEND.SAVE_PRECOMPOSED_TX, precomposedTx: result });
        }
    }, [sendContext, formContext, composeTransaction, dispatch]);

    return {
        sendContext,
        formContext,
        updateDraft,
        clearDraft,
        composeTransaction: compose,
    };
};
