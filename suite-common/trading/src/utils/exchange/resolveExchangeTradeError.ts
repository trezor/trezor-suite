import type { CryptoId, ErrorCode, TradeError } from 'invity-api';

export type ResolveTradeErrorOptions = {
    getCoinSymbol?: (cryptoId: CryptoId) => string | undefined;
};

type TradingErrorValuesRecord = Record<string, string | number | boolean | undefined>;

type StrictErrorMap<
    T extends Record<ErrorCode, TradingErrorValuesRecord | undefined> &
        Record<Exclude<keyof T, ErrorCode>, never>,
> = T;

export type TradingErrorValues = StrictErrorMap<{
    invalid_amount: { min: string; max: string };
    invalid_pair: { send: string; receive: string };
    invalid_address: { key: string };
    unavailable: { entityType: string; entityValue: string };
    invalid_input: { inputs: string };
    invalid_response: { errors: string };
    trade_not_found: { id: string };
    trade_expired: { orderId: string };
    trade_failed: { orderId: string };
    trade_refunded: { orderId: string };
    no_response: undefined;
    unknown: undefined;
}>;

export type ResolvedTradeError = {
    message?: string;
} & {
    [C in ErrorCode]: { code: C; values?: TradingErrorValues[C] };
}[ErrorCode];

export const isResolvedTradeError = (value: unknown): value is ResolvedTradeError =>
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    typeof value.code === 'string';

export type TradingErrorDisplay =
    { kind: 'detailed'; values: TradingErrorValuesRecord } | { kind: 'base'; message?: string };
type GetTradingErrorDisplayParams = {
    values?: TradingErrorValuesRecord;
    message?: string;
};

// This helper is prepared for using in desktop and native mobile apps,
// where we can use rich text formatting for structured error messages.
export const getTradingErrorDisplay = ({
    values,
    message,
}: GetTradingErrorDisplayParams): TradingErrorDisplay =>
    values ? { kind: 'detailed', values } : { kind: 'base', message };

export const resolveExchangeTradeError = (
    source: Partial<TradeError>,
    { getCoinSymbol }: ResolveTradeErrorOptions = {},
): ResolvedTradeError => {
    const details = source.errorDetails;

    if (!details) {
        return { code: 'unknown', message: source.error };
    }

    const resolveSymbol = (cryptoId: string): string =>
        getCoinSymbol?.(cryptoId as CryptoId) ?? cryptoId;

    const base = { message: details.message ?? details.externalCode };
    const asUnknown = (): ResolvedTradeError => ({ ...base, code: 'unknown' });

    switch (details.code) {
        case 'invalid_amount': {
            const { min, max } = details.amount ?? {};

            return {
                ...base,
                code: 'invalid_amount',
                values: min && max ? { min, max } : undefined,
            };
        }
        case 'invalid_pair': {
            const { send, receive } = details.pair ?? {};

            return {
                ...base,
                code: 'invalid_pair',
                values:
                    send && receive
                        ? { send: resolveSymbol(send), receive: resolveSymbol(receive) }
                        : undefined,
            };
        }
        case 'invalid_address': {
            const key = details.address?.key;

            return { ...base, code: 'invalid_address', values: key ? { key } : undefined };
        }
        case 'unavailable': {
            const { type, value } = details.entity ?? {};

            return {
                ...base,
                code: 'unavailable',
                values: type && value ? { entityType: type, entityValue: value } : undefined,
            };
        }
        case 'invalid_input': {
            return {
                ...base,
                code: 'invalid_input',
                // temporary comma join; replace with locale-aware list formatting at render later
                // TODO: Solve with design/UX team how to display multiple errors in a user-friendly way
                values: details.inputs?.length ? { inputs: details.inputs.join(', ') } : undefined,
            };
        }
        case 'invalid_response': {
            return {
                ...base,
                code: 'invalid_response',
                // temporary comma join; replace with locale-aware list formatting at render later
                // TODO: Solve with design/UX team how to display multiple errors in a user-friendly way
                values: details.errors?.length ? { errors: details.errors.join(', ') } : undefined,
            };
        }
        case 'trade_not_found': {
            return {
                ...base,
                code: 'trade_not_found',
                values: details.id ? { id: details.id } : undefined,
            };
        }
        case 'trade_expired':
        case 'trade_failed':
        case 'trade_refunded': {
            return {
                ...base,
                code: details.code,
                values: details.orderId ? { orderId: details.orderId } : undefined,
            };
        }
        case 'no_response':
            return { ...base, code: 'no_response' };
        case 'unknown':
            return asUnknown();
        default:
            details satisfies never;

            return asUnknown();
    }
};
