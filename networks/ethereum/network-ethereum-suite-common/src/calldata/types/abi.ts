import { type Abi, type AbiFunction, type AbiParameter } from 'viem';

export type NamedAbiParameter = AbiParameter & { name: string };

export type ExtractAbiFunction<T extends Abi> = Extract<T[number], AbiFunction>;

export type AbiParamName<T extends Abi> =
    ExtractAbiFunction<T> extends infer F extends AbiFunction
        ? Extract<F['inputs'][number], NamedAbiParameter>['name']
        : never;
