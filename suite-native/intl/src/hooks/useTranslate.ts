import { useCallback } from 'react';
import { type PrimitiveType, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { selectAreDebugTranslationKeysDisplayed } from '../localeSlice';
import { type TxKeyPath } from '../types';

type FormatXMLElementFn<T, R = string | T | (string | T)[]> = (parts: Array<string | T>) => R;

export type Translate = ReturnType<typeof useTranslate>['translate'];

export const useTranslate = () => {
    const { formatMessage } = useIntl();
    const areDebugTranslationKeysDisplayed = useSelector(selectAreDebugTranslationKeysDisplayed);

    const translate = useCallback(
        (
            id: TxKeyPath,
            values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
            options?: Parameters<typeof formatMessage>[2],
        ) => {
            if (areDebugTranslationKeysDisplayed) {
                return id;
            }

            return formatMessage({ id }, values, options);
        },
        [formatMessage, areDebugTranslationKeysDisplayed],
    );

    return { translate };
};
