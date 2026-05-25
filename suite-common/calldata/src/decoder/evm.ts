import { type Abi, type AbiFunction, decodeFunctionData } from 'viem';

import { type DecodedAbiInputs, type Decoder } from '../types/decoder';

const normalizers: Record<string, (value: unknown) => unknown> = {
    address: value => (typeof value === 'string' ? value.toLowerCase() : value),
};

const normalize = (value: unknown, type: string): unknown => {
    const arrayMatch = type.match(/^(.+?)\[/);
    if (arrayMatch && Array.isArray(value)) {
        // @ts-expect-error: noUncheckedIndexedAccess
        const secondMatch: string = arrayMatch[1];

        return value.map(item => normalize(item, secondMatch));
    }

    return normalizers[type]?.(value) ?? value;
};

export const createEvmDecoder = <const T extends Abi>(abi: T): Decoder<T> => {
    const functions = abi.filter((item): item is AbiFunction => item.type === 'function');
    if (functions.length === 0) throw new Error('No function in ABI');
    if (functions.length > 1) throw new Error('ABI must contain exactly one function');

    // @ts-expect-error: noUncheckedIndexedAccess
    const fn: AbiFunction = functions[0];

    const paramNames = fn.inputs.map(input => {
        if (!input.name) {
            throw new Error(`ABI function '${fn.name}' has unnamed parameters`);
        }

        return input.name;
    });

    return (data?: string) => {
        if (!data) return null;
        const normalized = (
            data.toLowerCase().startsWith('0x') ? data.toLowerCase() : `0x${data.toLowerCase()}`
        ) as `0x${string}`;
        try {
            const { args } = decodeFunctionData({ abi, data: normalized });
            const values = (args as readonly unknown[]).map((v, i) => {
                const { inputs } = fn;
                // @ts-expect-error: noUncheckedIndexedAccess
                const inputIndexed: AbiFunction['inputs'][number] = inputs[i];

                return normalize(v, inputIndexed.type);
            });

            return Object.fromEntries(
                paramNames.map((name, i) => [name, values[i]]),
            ) as DecodedAbiInputs<T>;
        } catch {
            return null;
        }
    };
};
