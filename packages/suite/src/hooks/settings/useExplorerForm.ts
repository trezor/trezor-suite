import { useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { Explorer, NetworkSymbol } from '@suite-common/wallet-config';
import { explorerActions } from '@suite-common/wallet-core';
import { isUrl } from '@trezor/utils';

import { useDispatch, useSelector, useTranslation } from '../suite';

const useExplorerInput = (currentValues: Explorer) => {
    const {
        register,
        formState: { errors },
        trigger,
        watch,
        setValue,
    } = useForm<Explorer>({
        mode: 'onChange',
        defaultValues: currentValues,
    });

    const { translationString } = useTranslation();

    const validateBaseUrl = (value: string) => {
        if (!isUrl(value)) {
            return translationString('TR_EXPLORER_INVALID_URL');
        }
    };

    const validateSuffix = (value?: string) => {
        if (value?.trim() === '') {
            return translationString('TR_EXPLORER_INVALID_SUFFIX');
        }
    };

    const { ref: baseInputRef, ...baseInputField } = register('base', {
        validate: validateBaseUrl,
    });

    const { ref: txInputRef, ...txInputField } = register('tx', {
        validate: validateSuffix,
    });

    const { ref: accountInputRef, ...accountInputField } = register('account', {
        validate: validateSuffix,
    });

    const { ref: addressInputRef, ...addressInputField } = register('address', {
        validate: validateSuffix,
    });

    const { ref: tokenInputRef, ...tokenInputField } = register('token', {
        validate: validateSuffix,
    });

    const { ref: nftInputRef, ...nftInputField } = register('nft', {
        validate: validateSuffix,
    });

    const { ref: queryStringInputRef, ...queryStringInputField } = register('queryString', {
        validate: validateSuffix,
    });

    return {
        validateBaseUrl,
        validateSuffix,

        trigger,
        register,
        setValue,
        errors,

        fields: {
            base: {
                ref: baseInputRef,
                value: watch('base'),
                field: baseInputField,
                error: errors.base?.message,
            },
            tx: {
                ref: txInputRef,
                value: watch('tx'),
                field: txInputField,
                error: errors.tx?.message,
            },
            account: {
                ref: accountInputRef,
                value: watch('account'),
                field: accountInputField,
                error: errors.account?.message,
            },
            address: {
                ref: addressInputRef,
                value: watch('address'),
                field: addressInputField,
                error: errors.address?.message,
            },
            token: {
                ref: tokenInputRef,
                value: watch('token'),
                field: tokenInputField,
                error: errors.token?.message,
            },
            nft: {
                ref: nftInputRef,
                value: watch('nft'),
                field: nftInputField,
                error: errors.nft?.message,
            },
            queryString: {
                ref: queryStringInputRef,
                value: watch('queryString'),
                field: queryStringInputField,
                error: errors.queryString?.message,
            },
        },
    };
};

export const useExplorerForm = (symbol: NetworkSymbol) => {
    const dispatch = useDispatch();

    const explorerConfig = useSelector(state => state.wallet.explorer[symbol]);

    const input = useExplorerInput(explorerConfig.custom ?? explorerConfig.default);
    const { base, tx, account, address, token, nft, queryString } = input.fields;

    const explorer: Explorer = useMemo(
        () => ({
            base: base.value,
            tx: tx.value,
            account: account.value,
            address: address.value,
            token: token.value,
            nft: nft.value,
            queryString: queryString.value,
        }),
        [base, tx, account, address, token, nft, queryString],
    );

    const normalizeExplorer = (explorer: Explorer) => {
        const stripSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, '');

        (Object.keys(explorer) as (keyof Explorer)[]).forEach(key => {
            if (!explorer[key]) return;
            explorer[key] = stripSlashes(explorer[key]);
        });

        return explorer;
    };

    const usesDefaultExplorer = useCallback(
        (explorer: Explorer) =>
            Object.keys(explorerConfig.default).every(
                key =>
                    explorer[key as keyof Explorer] ===
                    explorerConfig.default[key as keyof Explorer],
            ),
        [explorerConfig.default],
    );

    const save = () => {
        const normalizedExplorer = normalizeExplorer(explorer);
        const newExplorer = usesDefaultExplorer(normalizedExplorer)
            ? undefined
            : normalizedExplorer;
        dispatch(explorerActions.setExplorer({ symbol, explorer: newExplorer }));
    };

    const setDefaultValues = () => {
        input.setValue('base', explorerConfig.default.base);
        input.setValue('tx', explorerConfig.default.tx);
        input.setValue('account', explorerConfig.default.account);
        input.setValue('address', explorerConfig.default.address);
        input.setValue('token', explorerConfig.default.token);
        input.setValue('nft', explorerConfig.default.nft);
        input.setValue('queryString', explorerConfig.default.queryString);

        input.trigger();
    };

    const isValid =
        !input.fields.base.error &&
        !input.fields.tx.error &&
        !input.fields.account.error &&
        !input.fields.address.error &&
        !input.fields.token.error &&
        !input.fields.nft.error &&
        !input.fields.queryString.error;

    return {
        save,
        setDefaultValues,
        usesDefaultExplorer: usesDefaultExplorer(explorer),
        explorerConfig,
        input,
        isValid,
        explorer,
    };
};
