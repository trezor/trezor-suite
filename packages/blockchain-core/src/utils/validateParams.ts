import { ERRORS } from '@trezor/connect-common/src/constants';

export type Param = {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    required?: boolean;
    allowEmpty?: boolean;
};

export type CoinParams = { coin: string; identity?: string };

export const COIN_PARAMS: Param[] = [
    { name: 'coin', type: 'string', required: true },
    { name: 'identity', type: 'string' },
];

const invalidParameter = (message: string) => ERRORS.TypedError('Method_InvalidParameter', message);

/** Checks the params of a call the way Connect methods do. */
export const validateParams = (params: object, schema: Param[]) => {
    schema.forEach(({ name, type, required, allowEmpty }) => {
        const value: unknown = params[name as keyof typeof params];
        if (value == null) {
            if (required) throw invalidParameter(`Parameter "${name}" is missing.`);

            return;
        }

        if (type === 'array' && Array.isArray(value)) {
            if (!allowEmpty && value.length < 1) {
                throw invalidParameter(`Parameter "${name}" is empty.`);
            }
        } else if (type === 'array' || typeof value !== type) {
            throw invalidParameter(`Parameter "${name}" has invalid type. "${type}" expected.`);
        }
    });
};
