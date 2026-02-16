import { createPolicy } from '../policy/createPolicy';
import type { Param, ParamConfig } from '../types/param';

export const createParam = <Input, Output, Context = void>(
    config: ParamConfig<Input, Output, Context>,
): Param<Input, Output, Context> => {
    const policy = config.policy ?? createPolicy();

    return (input, path, context) => {
        const validationResult = config.validate(input, path, context);
        const policyResult = policy(validationResult.issues);

        return {
            ...policyResult,
            value: validationResult.value,
        };
    };
};
