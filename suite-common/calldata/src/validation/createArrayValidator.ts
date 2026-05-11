import { isNotNull } from '@trezor/utils';

import { type ValidationResult } from '../types/validation';

const allValid = <T>(values: (T | null)[]): values is T[] => values.every(isNotNull);

export const createArrayValidator =
    <Input, Output, Context = Record<string, unknown>>(
        elementValidator: (
            input: Input,
            path: string,
            context?: Context,
        ) => ValidationResult<Output>,
    ) =>
    (input: Input[], path: string, context?: Context): ValidationResult<Output[]> => {
        const results = input.map((item, i) => elementValidator(item, `${path}[${i}]`, context));
        const issues = results.flatMap(r => r.issues);
        const values = results.map(r => r.value);

        if (!allValid(values)) {
            return { value: null, issues };
        }

        return { value: values, issues };
    };
