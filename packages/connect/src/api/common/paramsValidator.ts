// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/paramsValidator.js

import { ERRORS } from '../../constants';
import { fromHardened } from '../../utils/pathUtils';
import type { CoinInfo } from '../../types';

type ParamType = 'string' | 'number' | 'array' | 'array-buffer' | 'boolean' | 'uint' | 'object';

type Param = {
    name: string;
    type?: ParamType | ParamType[];
    required?: boolean;
    allowEmpty?: boolean;
    allowNegative?: boolean;
};

const invalidParameter = (message: string) => ERRORS.TypedError('Method_InvalidParameter', message);

export function validateParams<P extends Record<string, any>>(params: P, schema: Param[]): P {
    schema.forEach(field => {
        const value = params[field.name];
        if (field.required && value == null) {
            // required parameter not found
            throw invalidParameter(`Parameter "${field.name}" is missing.`);
        }

        // parameter doesn't have a type or value, validation is pointless
        if (!field.type || value == null) return;

        const { name, type } = field;

        // schema type is a union
        if (Array.isArray(type)) {
            // create single field object
            const p: Record<string, any> = {};
            p[name] = value;
            // validate case for each type in union
            const success = type.reduce((count, t) => {
                try {
                    validateParams(p, [{ name: field.name, type: t }]);

                    return count + 1;
                } catch {
                    return count;
                }
            }, 0);
            // every case ended with error = no type match
            if (!success) {
                throw invalidParameter(
                    `Parameter "${name}" has invalid type. Union of "${type.join('|')}" expected.`,
                );
            }

            return;
        }

        if (type === 'array') {
            if (!Array.isArray(value)) {
                throw invalidParameter(`Parameter "${name}" has invalid type. "${type}" expected.`);
            }
            if (!field.allowEmpty && value.length < 1) {
                throw invalidParameter(`Parameter "${name}" is empty.`);
            }
        } else if (type === 'uint') {
            if (typeof value !== 'string' && typeof value !== 'number') {
                throw invalidParameter(
                    `Parameter "${name}" has invalid type. "string|number" expected.`,
                );
            }
            if (
                (typeof value === 'number' && !Number.isSafeInteger(value)) ||
                !/^(?:[1-9]\d*|\d)$/.test(
                    value.toString().replace(/^-/, field.allowNegative ? '' : '-'),
                )
            ) {
                throw invalidParameter(
                    `Parameter "${name}" has invalid value "${value}". Integer representation expected.`,
                );
            }
        } else if (type === 'array-buffer') {
            if (!(value instanceof ArrayBuffer)) {
                throw invalidParameter(
                    `Parameter "${name}" has invalid type. "ArrayBuffer" expected.`,
                );
            }
        } else if (typeof value !== type) {
            // invalid type
            throw invalidParameter(`Parameter "${name}" has invalid type. "${type}" expected.`);
        }
    });

    return params;
}

export const validateCoinPath = (path: number[], coinInfo?: CoinInfo) => {
    if (coinInfo && coinInfo.slip44 !== fromHardened(path[1])) {
        throw invalidParameter('Parameters "path" and "coin" do not match.');
    }
};
