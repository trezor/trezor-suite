import { type Abi, type AbiFunction, type AbiParameter, encodeFunctionData } from 'viem';

import { type Encoder } from '../types/encoder';

type ExtractAbiFunction<T extends Abi> = Extract<T[number], AbiFunction>;

type NamedAbiParameter = AbiParameter & { name: string };

type AbiParamName<T extends Abi> =
    ExtractAbiFunction<T> extends infer F extends AbiFunction
        ? Extract<F['inputs'][number], NamedAbiParameter>['name']
        : never;

export const createEvmEncoder = <const T extends Abi>(
    abi: T,
): Encoder<AbiParamName<T>, `0x${string}`> => {
    const functions = abi.filter((item): item is AbiFunction => item.type === 'function');
    if (functions.length === 0) throw new Error('No function in ABI');
    if (functions.length > 1) throw new Error('ABI must contain exactly one function');

    const fn = functions[0];

    const paramNames = fn.inputs.map(input => {
        if (!input.name) {
            throw new Error(`ABI function '${fn.name}' has unnamed parameters`);
        }

        return input.name;
    });

    return (values: Record<string, unknown>): `0x${string}` => {
        const valueKeys = Object.keys(values);

        if (valueKeys.length !== paramNames.length) {
            throw new Error(
                `Param count mismatch for '${fn.name}': expected ${paramNames.length}, got ${valueKeys.length}`,
            );
        }

        for (const name of paramNames) {
            if (!(name in values)) {
                throw new Error(`Missing param '${name}' for function '${fn.name}'`);
            }
            if (values[name] === undefined || values[name] === null) {
                throw new Error(`${fn.name}: Param '${name}' cannot be null/undefined`);
            }
        }

        return encodeFunctionData({
            abi,
            functionName: fn.name,
            args: paramNames.map(name => values[name]),
        } as Parameters<typeof encodeFunctionData>[0]);
    };
};
