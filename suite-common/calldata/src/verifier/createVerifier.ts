import { type Abi, type AbiFunction, decodeFunctionData, toFunctionSelector } from 'viem';

import { type AbiParamName } from '../types/abi';
import { type AbiParams, type VerifyIssue, type VerifyResult } from '../types/verifier';

export const createVerifier = <const T extends Abi>(config: { abi: T }) => {
    const functions = config.abi.filter((item): item is AbiFunction => item.type === 'function');

    if (functions.length === 0) throw new Error('No function in ABI');
    if (functions.length > 1) throw new Error('ABI must contain exactly one function');

    const fn = functions[0];
    const selector = toFunctionSelector(fn);
    const paramNames = fn.inputs
        .filter((input): input is typeof input & { name: string } => !!input.name)
        .map(input => input.name);

    return (
        externalHex: `0x${string}`,
        params: AbiParams<T>,
        fields?: AbiParamName<T>[],
    ): VerifyResult => {
        if (externalHex.slice(0, 10).toLowerCase() !== selector.toLowerCase()) {
            return { isValid: false, issues: [{ code: 'SIGNATURE_MISMATCH', field: null }] };
        }

        try {
            const decoded = decodeFunctionData({ abi: config.abi, data: externalHex });

            if (!Array.isArray(decoded.args)) {
                return { isValid: false, issues: [{ code: 'DECODING_FAILED', field: null }] };
            }

            const fieldsToCheck = fields ?? (paramNames as AbiParamName<T>[]);
            const issues: VerifyIssue[] = [];

            for (const field of fieldsToCheck) {
                const index = paramNames.indexOf(field);

                if (index === -1) {
                    throw new Error(
                        `Field '${field}' not found in ABI params: ${paramNames.join(', ')}`,
                    );
                }

                const decodedValue = decoded.args[index];
                const expectedValue = params[field];

                if (String(decodedValue).toLowerCase() !== String(expectedValue).toLowerCase()) {
                    issues.push({ code: 'VALUE_MISMATCH', field });
                }
            }

            return { isValid: issues.length === 0, issues };
        } catch {
            return { isValid: false, issues: [{ code: 'DECODING_FAILED', field: null }] };
        }
    };
};
