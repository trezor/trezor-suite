import { type Abi, type AbiFunction, type AbiParameterToPrimitiveType } from 'viem';

import { type AbiParamName, type ExtractAbiFunction, type NamedAbiParameter } from './abi';

type AbiParamByName<T extends Abi, N extends string> =
    ExtractAbiFunction<T> extends infer F extends AbiFunction
        ? Extract<Extract<F['inputs'][number], NamedAbiParameter>, { name: N }>
        : never;

export type AbiParams<T extends Abi> = {
    [K in AbiParamName<T>]: AbiParameterToPrimitiveType<AbiParamByName<T, K>>;
};

export type VerifyIssueCode = 'DECODING_FAILED' | 'SIGNATURE_MISMATCH' | 'VALUE_MISMATCH';

export type VerifyIssue = {
    code: VerifyIssueCode;
    field: string | null;
};

export type VerifyResult = {
    isValid: boolean;
    issues: VerifyIssue[];
};
