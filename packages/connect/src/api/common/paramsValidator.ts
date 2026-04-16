// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/paramsValidator.js
import type {
    CoinInfo,
    FirmwareBoundary,
    FirmwareRange,
    FirmwareRule,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { typedObjectTransformValues, versionUtils } from '@trezor/utils';

import { config } from '../../data/config';
import { fromHardened } from '../../utils/pathUtils';

type ParamType = 'string' | 'number' | 'array' | 'array-buffer' | 'boolean' | 'uint' | 'object';

type Param = {
    name: string;
    type?: ParamType | ParamType[];
    required?: boolean;
    allowEmpty?: boolean;
    allowNegative?: boolean;
};

const invalidParameter = (message: string) => ERRORS.TypedError('Method_InvalidParameter', message);

export const bundlify = <T extends { bundle?: unknown[] }>(payload: T) => ({
    hasBundle: !!payload.bundle,
    payload: {
        ...payload,
        bundle: payload.bundle ?? [payload],
    },
});

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
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const slip44Component: number = path[1];
    if (coinInfo && coinInfo.slip44 !== fromHardened(slip44Component)) {
        throw invalidParameter('Parameters "path" and "coin" do not match.');
    }
};

export const DEFAULT_FIRMWARE_RANGE: FirmwareRange = {
    UNKNOWN: { min: '1.0.0', max: '0' },
    T1B1: { min: '1.0.0', max: '0' },
    T2T1: { min: '2.0.0', max: '0' },
    T2B1: { min: '2.6.1', max: '0' },
    T3B1: { min: '2.8.1', max: '0' },
    T3T1: { min: '2.7.1', max: '0' },
    T3W1: { min: '2.7.1', max: '0' },
};

const intersectMin = (a: FirmwareBoundary, b: FirmwareBoundary) =>
    a === '0' || (b !== '0' && versionUtils.isNewer(a, b)) ? a : b;

const intersectMax = (a: FirmwareBoundary, b: FirmwareBoundary) =>
    a === '0' || (b !== '0' && versionUtils.isNewer(a, b)) ? b : a;

const intersectRange = (a: FirmwareRange, b: FirmwareRange) =>
    typedObjectTransformValues(a, (value, model) => ({
        min: intersectMin(value.min, b[model].min),
        max: intersectMax(value.max, b[model].max),
    }));

const ensureArray = <T>(item: T | T[] = []) => (Array.isArray(item) ? item : [item]);

const filterByCoins = (coins: CoinInfo[]) => {
    const coinSet = new Set(coins.map(coin => coin.shortcut.toLowerCase()));
    const coinTypeSet = new Set<string>(coins.map(coin => coin.type));

    return (rule: FirmwareRule) =>
        (!rule.coin && !rule.coinType) ||
        ensureArray(rule.coin).some(coinSet.has.bind(coinSet)) ||
        ensureArray(rule.coinType).some(coinTypeSet.has.bind(coinTypeSet));
};

const filterByMethods = (methodsOrCapabilities: string[]) => {
    const methodSet = new Set(methodsOrCapabilities);

    return (rule: FirmwareRule) =>
        (!rule.methods && !rule.capabilities) ||
        ensureArray(rule.methods).some(methodSet.has.bind(methodSet)) ||
        ensureArray(rule.capabilities).some(methodSet.has.bind(methodSet));
};

const getCoinRules = (coins: CoinInfo[], currentRange: FirmwareRange): FirmwareRange[] =>
    coins.map(({ support = typedObjectTransformValues(DEFAULT_FIRMWARE_RANGE, () => false) }) => ({
        ...currentRange,
        ...typedObjectTransformValues(support, value => ({
            min: (value || '0') as FirmwareBoundary,
            max: '0' as const,
        })),
    }));

const getConfigRules = (
    methodsOrCapabilities: string[],
    coins: CoinInfo[],
    currentRange: FirmwareRange,
): FirmwareRange[] =>
    config.supportedFirmware
        .filter(filterByCoins(coins))
        .filter(filterByMethods(methodsOrCapabilities))
        .map(({ min, max }) =>
            typedObjectTransformValues(currentRange, (value, key) => ({
                min: min?.[key] ?? value.min,
                max: max?.[key] ?? value.max,
            })),
        );

export const getFirmwareRange = (
    methodsOrCapabilities: string[],
    coins: CoinInfo[],
    currentRange = DEFAULT_FIRMWARE_RANGE,
) =>
    getCoinRules(coins, currentRange)
        .concat(getConfigRules(methodsOrCapabilities, coins, currentRange))
        .reduce(intersectRange, currentRange);
