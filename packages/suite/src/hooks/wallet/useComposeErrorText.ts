import { useCallback } from 'react';

import { type TranslationKey, useTranslation } from '@suite/intl';
import { selectNetworkDisplaySymbol } from '@suite-common/networks';
import { type ComposeErrorMessage } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectGetState } from '@trezor/redux-utils';
import { typedObjectTransformValues } from '@trezor/utils';

/**
 * A compose error as plain text, for react-hook-form errors and toasts, which take only a string.
 * Reads coin symbols from the networks state, since `AssetSymbol` cannot render into a string.
 */
export const useComposeErrorText = () => {
    const { getState } = useServices(injectGetState);
    const { translationString } = useTranslation();

    return useCallback(
        (
            id: TranslationKey,
            { values, networkSymbolValues = {} }: Omit<ComposeErrorMessage, 'id'>,
        ) =>
            translationString(id, {
                ...values,
                ...typedObjectTransformValues(
                    networkSymbolValues,
                    networkSymbol => selectNetworkDisplaySymbol(getState(), networkSymbol) ?? '',
                ),
            }),
        [getState, translationString],
    );
};
