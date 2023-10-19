import { useIntl } from 'react-intl';
import { useCallback } from 'react';

import { TxKeyPath } from './types';

export const useTranslate = () => {
    const { formatMessage } = useIntl();

    const translate = useCallback(
        (
            id: TxKeyPath,
            values?: Parameters<typeof formatMessage>[1],
            options?: Parameters<typeof formatMessage>[2],
        ) => formatMessage({ id }, values, options) as string,
        [formatMessage],
    );

    return { translate };
};
