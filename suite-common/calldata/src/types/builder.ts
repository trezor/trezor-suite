import type { Encoder } from './encoder';
import type { Param } from './param';
import type { IssueWithSeverity } from './policy';

export type { Encoder };

export type ParamsConfig<
    ParamNames extends string,
    Config = Record<ParamNames, Param<any, any, any>>,
> = {
    [K in ParamNames]: Param<any, any, any>;
} & (Exclude<keyof Config, ParamNames> extends never
    ? unknown
    : { [K in Exclude<keyof Config, ParamNames>]: never });

type ExtractParamInput<T> = T extends Param<infer I, any, any> ? I : never;
export type ExtractParamNames<E> = E extends Encoder<infer P, unknown> ? P : never;

export type ExtractEncoderOutput<E> = E extends Encoder<string, infer O> ? O : never;

export type ExtractInputs<ParamNames extends string, Config extends ParamsConfig<ParamNames>> = {
    [K in ParamNames]: ExtractParamInput<Config[K]>;
};

export type ExtractContext<Config> =
    Config extends Record<string, Param<any, any, infer C>> ? C : void;

export interface BuilderConfig<E extends Encoder> {
    params: ParamsConfig<ExtractParamNames<E>>;
    encode: E;
}

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
