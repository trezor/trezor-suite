import { typedObjectFromEntries } from '@trezor/utils';

import {
    type BuildResult,
    type Builder,
    type Encoder,
    type ExtractContext,
    type ExtractEncoderOutput,
    type ExtractInputs,
    type ExtractParamNames,
} from '../types/builder';
import { type Param } from '../types/param';

export const createBuilder = <
    E extends Encoder<string, unknown>,
    Config extends Record<ExtractParamNames<E>, Param<any, any, any>>,
>(
    config: { params: Config; encode: E } & ([Exclude<keyof Config, ExtractParamNames<E>>] extends [
        never,
    ]
        ? unknown
        : { params: Record<Exclude<keyof Config & string, ExtractParamNames<E>>, never> }),
): Builder<
    ExtractInputs<ExtractParamNames<E>, Config>,
    ExtractContext<Config>,
    ExtractEncoderOutput<E>
> => {
    const paramNames = Object.keys(config.params) as ExtractParamNames<E>[];

    return (
        inputs: Record<string, unknown>,
        context: unknown = {},
    ): BuildResult<ExtractEncoderOutput<E>> => {
        const results = paramNames.map(paramName => ({
            paramName,
            ...config.params[paramName](inputs[paramName], paramName, context),
        }));

        const issues = results.flatMap(r => r.issues);
        const errors = results.flatMap(r => r.errors);
        const warnings = results.flatMap(r => r.warnings);
        const isValid = results.every(r => r.isValid);

        if (!isValid) {
            return { data: null, issues, errors, warnings, isValid };
        }

        const values = typedObjectFromEntries(results.map(r => [r.paramName, r.value] as const));

        try {
            const data = config.encode(values) as ExtractEncoderOutput<E>;

            return { data, issues, errors, warnings, isValid };
        } catch {
            const encodingError = {
                code: 'ENCODING_FAILED' as const,
                path: null,
                severity: 'error' as const,
            };

            return {
                data: null,
                issues: [...issues, encodingError],
                errors: [...errors, encodingError],
                warnings,
                isValid: false,
            };
        }
    };
};
