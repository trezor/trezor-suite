import { ComposeOutput, ComposeFinalOutput, ComposeNotFinalOutput } from '../types';

export function splitByCompleteness(outputs: ComposeOutput[]) {
    const complete: ComposeFinalOutput[] = [];
    const incomplete: ComposeNotFinalOutput[] = [];

    outputs.forEach(output => {
        if (output.type === 'payment' || output.type === 'send-max' || output.type === 'opreturn') {
            complete.push(output);
        } else {
            incomplete.push(output);
        }
    });

    return {
        complete,
        incomplete,
    };
}

export function getMax(outputs: ComposeOutput[]) {
    // first, call coinselect - either sendMax or bnb
    // and if the input data are complete, also make the whole transaction

    const countMaxRequests = outputs.filter(
        output => output.type === 'send-max-noaddress' || output.type === 'send-max',
    );
    if (countMaxRequests.length >= 2) {
        throw new Error('TWO-SEND-MAX');
    }

    const id = outputs.findIndex(
        output => output.type === 'send-max-noaddress' || output.type === 'send-max',
    );
    const exists = countMaxRequests.length === 1;

    return {
        id,
        exists,
    };
}
