import { TradingSendRejectedProps } from '../../types';

export const getSafeRejectedType = (payload: unknown): TradingSendRejectedProps['type'] => {
    if (!payload || typeof payload !== 'object' || !('type' in payload)) {
        return 'sign-tx-error';
    }

    const { type } = payload;

    return type === 'error' || type === 'sign-tx-error' || type === 'sign-transaction-timeout'
        ? type
        : 'sign-tx-error';
};
