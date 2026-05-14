import { typedObjectFromEntries } from '@trezor/utils';

import { createPolicy } from '../policy/createPolicy';
import type {
    BuildResult,
    Builder,
    CrossValidator,
    Encoder,
    ExtractContext,
    ExtractEncoderOutput,
    ExtractInputs,
    ExtractParamNames,
} from '../types/builder';
import { type Param } from '../types/param';
const defaultPolicy = createPolicy();

export const createBuilder = <
    E extends Encoder<string, unknown>,
    Config extends Record<ExtractParamNames<E>, Param<any, any, any>>,
>(
    config: {
        params: Config;
        encode: E;
        crossValidate?: NoInfer<CrossValidator<keyof Config & string, Config>[]>;
    } & ([Exclude<keyof Config, ExtractParamNames<E>>] extends [never]
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

        if (config.crossValidate) {
            const crossIssues = config.crossValidate.flatMap(fn =>
                fn(values as unknown as Parameters<typeof fn>[0]),
            );
            const crossErrors = crossIssues.filter(i => i.severity === 'error');
            const crossWarnings = crossIssues.filter(i => i.severity === 'warning');

            issues.push(...crossIssues);
            errors.push(...crossErrors);
            warnings.push(...crossWarnings);

            if (crossErrors.length > 0) {
                return { data: null, issues, errors, warnings, isValid: false };
            }
        }

        try {
            const data = config.encode(values) as ExtractEncoderOutput<E>;

            return { data, issues, errors, warnings, isValid };
        } catch {
            const { issues: encodingIssues, errors: encodingErrors } = defaultPolicy([
                { code: 'ENCODING_FAILED' as const, path: null },
            ]);

            return {
                data: null,
                issues: [...issues, ...encodingIssues],
                errors: [...errors, ...encodingErrors],
                warnings,
                isValid: false,
            };
        }
    };
};
