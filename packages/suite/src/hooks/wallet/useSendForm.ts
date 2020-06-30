import { createContext, useContext, useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
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
    const sendContext = useContext(SendContext) as ContextState;
    const formContext = useFormContext<FormState>();

    return {
        sendContext,
        formContext,
    };
};
