import { FormState, PartialFormState, UseSendFormState } from '@wallet-types/sendForm';

type Props = {
    fiatRates: UseSendFormState['fiatRates'];
    getLoadedValues: (loadedState?: Partial<FormState>) => FormState;
};

// This hook should be used only as a sub-hook of `useSendForm`

export const useSendFormImport = ({ getLoadedValues, fiatRates }: Props) => {
    // state loaded from ImportTransaction modal
    const importTransaction = (loadedState: PartialFormState) => {
        const defaultState = getLoadedValues();

        console.warn('loadedState', loadedState, defaultState, fiatRates);

        if (loadedState.outputs) {
            loadedState.outputs = loadedState.outputs.map(output => {
                if (output.type === 'opreturn') {
                    return output;
                }
                if (output.amount) {
                    // TODO: calculateFiat
                } else if (output.fiat) {
                    // TODO: calculate amount
                }
                return { ...defaultState.outputs[0], ...output };
            });
        }

        return {
            ...defaultState,
            ...loadedState,
        };
    };

    return {
        importTransaction,
    };
};
