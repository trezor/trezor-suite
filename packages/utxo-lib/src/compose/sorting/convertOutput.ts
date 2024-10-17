import { CoinSelectOutputFinal, ComposeChangeAddress, ComposeFinalOutput } from '../../types';

export const convertOutput = (
    selectedOutput: CoinSelectOutputFinal,
    composeOutput: ComposeFinalOutput | ({ type: 'change' } & ComposeChangeAddress),
) => {
    if (composeOutput.type === 'change') {
        return {
            ...composeOutput,
            amount: selectedOutput.value.toString(),
        };
    }

    if (composeOutput.type === 'opreturn') {
        return composeOutput;
    }

    return {
        ...composeOutput,
        type: 'payment' as const,
        amount: selectedOutput.value.toString(),
    };
};
