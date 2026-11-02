export type Encoder<ParamNames extends string = string, Output = unknown> = (
    values: Record<ParamNames, unknown>,
) => Output;
