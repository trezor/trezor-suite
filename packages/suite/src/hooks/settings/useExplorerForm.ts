import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useTranslation } from '@suite/intl';
import { type Explorer, type NetworkSymbol } from '@suite-common/wallet-config';
import { explorerActions, selectNetworkExplorers } from '@suite-common/wallet-core';
import { isUrl } from '@trezor/utils';

import { useDispatch, useSelector } from '../suite';

const useExplorerInput = (currentValues: Explorer) => {
    const {
        register,
        formState: { errors },
        trigger,
        control,
        setValue,
    } = useForm<Explorer>({
        mode: 'onChange',
        defaultValues: currentValues,
    });

    const [base, tx, address, token, nft, queryString] = useWatch({
        control,
        name: ['base', 'tx', 'address', 'token', 'nft', 'queryString'],
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

    const { ref: addressInputRef, ...addressInputField } = register('address', {
        validate: validateSuffix,
    });

    const { ref: tokenInputRef, ...tokenInputField } = register('token', {
        validate: validateSuffix,
    });

    const { ref: nftInputRef, ...nftInputField } = register('nft', {
        validate: validateSuffix,
    });

    const { ref: queryStringInputRef, ...queryStringInputField } = register('queryString');

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
                value: base,
                field: baseInputField,
                error: errors.base?.message,
            },
            tx: {
                ref: txInputRef,
                value: tx,
                field: txInputField,
                error: errors.tx?.message,
            },
            address: {
                ref: addressInputRef,
                value: address,
                field: addressInputField,
                error: errors.address?.message,
            },
            token: {
                ref: tokenInputRef,
                value: token,
                field: tokenInputField,
                error: errors.token?.message,
            },
            nft: {
                ref: nftInputRef,
                value: nft,
                field: nftInputField,
                error: errors.nft?.message,
            },
            queryString: {
                ref: queryStringInputRef,
                value: queryString,
                field: queryStringInputField,
                error: errors.queryString?.message,
            },
        },
    };
};

export const useExplorerForm = (symbol: NetworkSymbol) => {
    const dispatch = useDispatch();

    const explorerConfig = useSelector(state => selectNetworkExplorers(state, symbol));

    const input = useExplorerInput(explorerConfig.custom ?? explorerConfig.default);
    const { base, tx, address, token, nft, queryString } = input.fields;

    const explorer: Explorer = useMemo(
        () => ({
            base: base.value,
            tx: tx.value,
            address: address.value,
            token: token.value,
            nft: nft.value,
            queryString: queryString.value,
        }),
        [base, tx, address, token, nft, queryString],
    );

    const save = () => {
        dispatch(explorerActions.setExplorer({ symbol, explorer }));
    };

    const setDefaultValues = () => {
        input.setValue('base', explorerConfig.default.base);
        input.setValue('tx', explorerConfig.default.tx);
        input.setValue('address', explorerConfig.default.address);
        input.setValue('token', explorerConfig.default.token);
        input.setValue('nft', explorerConfig.default.nft);
        input.setValue('queryString', explorerConfig.default.queryString);

        input.trigger();
    };

    const isValid =
        !input.fields.base.error &&
        !input.fields.tx.error &&
        !input.fields.address.error &&
        !input.fields.token.error &&
        !input.fields.nft.error &&
        !input.fields.queryString.error;

    return {
        save,
        setDefaultValues,
        usesDefaultExplorer: explorerConfig.custom === undefined,
        explorerConfig,
        input,
        isValid,
        explorer,
    };
};
