import { useMemo } from 'react';

import { useTranslate } from '@suite-native/intl';

import {
    PrecomposedTransactionErrorContext,
    getPrecomposedTransactionErrorTranslation,
} from '../utils/precomposedTransactionErrorUtils';

type UsePrecomposedTransactionErrorProps = {
    error: string | null | undefined;
    context: PrecomposedTransactionErrorContext;
};

/**
 * Hook to get precomposed transaction error translation with proper values
 */
export const usePrecomposedTransactionError = ({
    error,
    context,
}: UsePrecomposedTransactionErrorProps): string | null => {
    const { translate } = useTranslate();

    return useMemo(() => {
        const errorData = getPrecomposedTransactionErrorTranslation(error, context);

        if (!errorData) {
            return null;
        }

        const { txKeyPath, values } = errorData;

        return translate(txKeyPath, values);
    }, [error, context, translate]);
};
