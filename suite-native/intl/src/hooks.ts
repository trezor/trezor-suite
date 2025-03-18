import { useCallback } from 'react';
import { PrimitiveType, useIntl } from 'react-intl';

import { TxKeyPath } from './types';

type FormatXMLElementFn<T, R = string | T | (string | T)[]> = (parts: Array<string | T>) => R;

export const useTranslate = () => {
    const { formatMessage } = useIntl();

    const translate = useCallback(
        (
            id: TxKeyPath,
            values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
            options?: Parameters<typeof formatMessage>[2],
        ) => formatMessage({ id }, values, options),
        [formatMessage],
    );

    return { translate };
};
