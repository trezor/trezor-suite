import { SortingStrategy } from './sortingStrategy';
import { convertOutput } from './convertOutput';

export const noneSortingStrategy: SortingStrategy = ({ result, request, convertedInputs }) => {
    const convertedOutputs = result.outputs.map((output, index) => {
        if (request.outputs[index]) {
            return convertOutput(output, request.outputs[index]);
        }

        return convertOutput(output, { type: 'change', ...request.changeAddress });
    });

    return {
        inputs: convertedInputs,
        outputs: convertedOutputs,
        outputsPermutation: Array.from(convertedOutputs.keys()),
    };
};
