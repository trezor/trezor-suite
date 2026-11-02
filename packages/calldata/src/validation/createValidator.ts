import { isNotNull } from '@trezor/utils';

import { type IssueCode, type ValidationResult } from '../types/validation';

export type ValidateFn<Input> = (input: Input) => IssueCode | null;
export type InspectFn<Output, Context = Record<string, unknown>> = (
    value: Output,
    context?: Context,
) => IssueCode | null;

export interface ValidatorConfig<Input, Output, Context = Record<string, unknown>> {
    validate: Array<ValidateFn<Input>>;
    normalize: (input: Input) => Output;
    inspect?: Array<InspectFn<Output, Context>>;
}

export const createValidator =
    <Input, Output, Context = Record<string, unknown>>(
        config: ValidatorConfig<Input, Output, Context>,
    ) =>
    (input: Input, path: string, context?: Context): ValidationResult<Output> => {
        for (const validateFn of config.validate) {
            const code = validateFn(input);
            if (isNotNull(code)) {
                return { value: null, issues: [{ code, path }] };
            }
        }

        const normalizedValue = config.normalize(input);

        const inspectIssues = (config.inspect ?? [])
            .map(inspectFn => inspectFn(normalizedValue, context))
            .filter(isNotNull)
            .map(code => ({ code, path }));

        return { value: normalizedValue, issues: inspectIssues };
    };
