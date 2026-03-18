import type { Encoder } from './encoder';
import type { Param } from './param';
import type { IssueWithSeverity } from './policy';

export type { Encoder };

type ExtractParamInput<T> = T extends Param<infer I, any, any> ? I : never;
export type ExtractParamNames<E> = E extends Encoder<infer P, unknown> ? P : never;

export type ExtractEncoderOutput<E> = E extends Encoder<string, infer O> ? O : never;

export type ExtractInputs<
    ParamNames extends string,
    Config extends Record<ParamNames, Param<any, any, any>>,
> = {
    [K in ParamNames]: ExtractParamInput<Config[K]>;
};

export type ExtractContext<Config> =
    Config extends Record<string, Param<any, any, infer C>> ? C : void;

interface BuildResultBase {
    issues: IssueWithSeverity[];
    errors: IssueWithSeverity[];
    warnings: IssueWithSeverity[];
}

export type BuildResult<Data = unknown> =
    | ({ isValid: true; data: Data } & BuildResultBase)
    | ({ isValid: false; data: null } & BuildResultBase);

export type Builder<Inputs extends Record<string, unknown>, Context = void, Data = unknown> = (
    inputs: Inputs,
    context?: Context,
) => BuildResult<Data>;
