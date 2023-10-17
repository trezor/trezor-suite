// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/paramsValidator.js
import { versionUtils } from '@trezor/utils';

import { ERRORS } from '../../constants';
import { fromHardened } from '../../utils/pathUtils';
import { config } from '../../data/config';
import type { CoinInfo, FirmwareRange } from '../../types';

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
                } catch (e) {
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

export const getFirmwareRange = (
    method: string,
    coinInfo: CoinInfo | null | undefined,
    currentRange: FirmwareRange,
) => {
    const current: FirmwareRange = JSON.parse(JSON.stringify(currentRange));
    // set minimum required firmware from coins.json (coinInfo)
    if (coinInfo) {
        if (!coinInfo.support || typeof coinInfo.support.T1B1 !== 'string') {
            current.T1B1.min = '0';
        } else if (
            current.T1B1.min !== '0' &&
            versionUtils.isNewer(coinInfo.support.T1B1, current.T1B1.min)
        ) {
            current.T1B1.min = coinInfo.support.T1B1;
        }

        if (!coinInfo.support || typeof coinInfo.support.T2T1 !== 'string') {
            current.T2T1.min = '0';
        } else if (
            current.T2T1.min !== '0' &&
            versionUtils.isNewer(coinInfo.support.T2T1, current.T2T1.min)
        ) {
            current.T2T1.min = coinInfo.support.T2T1;
        }
    }

    const coinType = coinInfo ? coinInfo.type : null;
    const shortcut = coinInfo ? coinInfo.shortcut.toLowerCase() : null;
    // find firmware range in config.json
    const ranges = config.supportedFirmware
        .filter(rule => {
            // check if rule applies to requested method
            if (rule.methods) {
                return rule.methods.includes(method);
            }
            // check if rule applies to capability
            if (rule.capabilities) {
                return rule.capabilities.includes(method);
            }
            // rule doesn't have specified methods
            // it may be a global rule for coin or coinType
            return true;
        })
        .filter(c => {
            // REF_TODO: there is no coinType in config. possibly obsolete code?
            // probably still useful, we just need to define type for config and not infer it.
            // @ts-expect-error
            if (c.coinType) {
                // rule for coin type
                // @ts-expect-error
                return c.coinType === coinType;
            }
            if (c.coin) {
                // rule for coin shortcut
                // @ts-expect-error
                return (typeof c.coin === 'string' ? [c.coin] : c.coin).includes(shortcut!);
            }
            // rule for method
            return c.methods || c.capabilities;
        });

    ranges.forEach(range => {
        const { min, max } = range;
        // override defaults
        // NOTE:
        // 0 may be confusing. means: no-support for "min" and unlimited support for "max"
        if (min) {
            const { T1B1, T2T1 } = min;
            if (
                T1B1 === '0' ||
                current.T1B1.min === '0' ||
                !versionUtils.isNewerOrEqual(current.T1B1.min, T1B1)
            ) {
                current.T1B1.min = T1B1;
            }
            if (
                T2T1 === '0' ||
                current.T2T1.min === '0' ||
                !versionUtils.isNewerOrEqual(current.T2T1.min, T2T1)
            ) {
                current.T2T1.min = T2T1;
            }
        }
        if (max) {
            const { T1B1, T2T1 } = max;
            if (
                T1B1 === '0' ||
                current.T1B1.max === '0' ||
                !versionUtils.isNewerOrEqual(current.T1B1.max, T1B1)
            ) {
                current.T1B1.max = T1B1;
            }
            if (
                T2T1 === '0' ||
                current.T2T1.max === '0' ||
                !versionUtils.isNewerOrEqual(current.T2T1.max, T2T1)
            ) {
                current.T2T1.max = T2T1;
            }
        }
    });

    return current;
};
