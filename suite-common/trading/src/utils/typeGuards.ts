import { isArrayMember } from '@trezor/utils';

import { type TradingSendRejectedProps } from '../types';

const TRADING_SEND_REJECTED_TYPES = [
    'error',
    'sign-tx-error',
    'sign-transaction-timeout',
    'sign-cancelled',
] as const;

const SILENT_SEND_REJECTED_TYPES = ['sign-transaction-timeout', 'sign-cancelled'] as const;

export const isSilentSendRejection = (
    type: TradingSendRejectedProps['type'],
): type is (typeof SILENT_SEND_REJECTED_TYPES)[number] =>
    isArrayMember(type, SILENT_SEND_REJECTED_TYPES);

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const isSendRejectedError = <TranslationKey extends string = string>(
    error: unknown,
): error is TradingSendRejectedProps<TranslationKey> => {
    if (!isObject(error)) {
        return false;
    }

    const { type, error: errorData } = error;

    if (typeof type !== 'string' || !isArrayMember(type, TRADING_SEND_REJECTED_TYPES)) {
        return false;
    }

    if (!isObject(errorData)) {
        return false;
    }

    if (typeof errorData.id !== 'string') {
        return false;
    }

    if (
        errorData.values !== undefined &&
        (typeof errorData.values !== 'object' || errorData.values === null)
    ) {
        return false;
    }

    return true;
};
