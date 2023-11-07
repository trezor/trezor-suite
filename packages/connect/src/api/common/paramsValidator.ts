// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/paramsValidator.js
import { versionUtils } from '@trezor/utils';

import { ERRORS } from '../../constants';
import { fromHardened } from '../../utils/pathUtils';
import { config } from '../../data/config';
import type { CoinInfo, FirmwareRange, DeviceModelInternal } from '../../types';

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
            // eslint-disable-next-line valid-typeof
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
    const range = JSON.parse(JSON.stringify(currentRange)) as FirmwareRange;
    const models = Object.keys(range) as DeviceModelInternal[];
    // set minimum required firmware from coins.json (coinInfo)
    if (coinInfo) {
        models.forEach(model => {
            if (!coinInfo.support || typeof coinInfo.support[model] !== 'string') {
                range[model].min = '0';
            } else if (
                range[model].min !== '0' &&
                versionUtils.isNewer(coinInfo.support[model], range[model].min)
            ) {
                range[model].min = coinInfo.support[model];
            }
        });
    }

    const coinType = coinInfo?.type;
    const shortcut = coinInfo?.shortcut.toLowerCase();
    // find firmware range in config.json
    const configRules = config.supportedFirmware
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
        .filter(rule => {
            // REF_TODO: there is no coinType in config. possibly obsolete code?
            // probably still useful, we just need to define type for config and not infer it.
            // @ts-expect-error
            if (rule.coinType) {
                // rule for coin type
                // @ts-expect-error
                return rule.coinType === coinType;
            }
            if (rule.coin) {
                // rule for coin shortcut
                // @ts-expect-error
                return (typeof rule.coin === 'string' ? [rule.coin] : rule.coin).includes(shortcut);
            }
            // rule for method
            return rule.methods || rule.capabilities;
        });

    configRules.forEach(rule => {
        // override defaults
        // NOTE:
        // 0 may be confusing. means: no-support for "min" and unlimited support for "max"
        if (rule.min) {
            models.forEach(model => {
                const modelMin = rule.min[model];
                if (modelMin) {
                    if (
                        modelMin === '0' ||
                        range[model].min === '0' ||
                        !versionUtils.isNewerOrEqual(range[model].min, modelMin)
                    ) {
                        range[model].min = modelMin;
                    }
                }
            });
        }
        if (rule.max) {
            models.forEach(model => {
                // @ts-expect-error same issue as in coinType above, config needs to be typed not inferred.
                const modelMax = rule.max[model];
                if (modelMax) {
                    if (
                        modelMax === '0' ||
                        range[model].max === '0' ||
                        !versionUtils.isNewerOrEqual(range[model].max, modelMax)
                    ) {
                        range[model].max = modelMax;
                    }
                }
            });
        }
    });

    return range;
};
