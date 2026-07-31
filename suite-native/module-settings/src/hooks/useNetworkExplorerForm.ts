import { useMemo } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { yup } from '@suite-common/validators';
import { type Explorer, type Network } from '@suite-common/wallet-config';
import {
    type ExplorerState,
    selectNetworkExplorers,
    setNetworkExplorerThunk,
} from '@suite-common/wallet-core';
import { useForm } from '@suite-native/forms';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { isUrl } from '@trezor/utils';

type PathInputField = {
    name: keyof Explorer;
    label: TxKeyPath;
};

export const useNetworkExplorerForm = ({ symbol }: Network) => {
    const dispatch = useDispatch();
    const { translate } = useTranslate();

    const networkExplorers = useSelector((state: ExplorerState) =>
        selectNetworkExplorers(state, symbol),
    );

    const pathInputFields = useMemo(() => {
        const allInputFields: PathInputField[] = [
            { name: 'tx', label: 'moduleSettings.networkBackends.explorer.labels.tx' },
            { name: 'address', label: 'moduleSettings.networkBackends.explorer.labels.address' },
            { name: 'nft', label: 'moduleSettings.networkBackends.explorer.labels.nft' },
            { name: 'token', label: 'moduleSettings.networkBackends.explorer.labels.token' },
            {
                name: 'queryString',
                label: 'moduleSettings.networkBackends.explorer.labels.queryString',
            },
        ];

        return allInputFields.filter(({ name }) => networkExplorers.default[name] !== undefined);
    }, [networkExplorers.default]);

    const invalidValueMessage = translate('moduleSettings.networkBackends.explorer.invalidValue');
    const isValidUrl = (value?: string) => !!value && isUrl(value);
    const isValidPath = (value: string | undefined, { path }: yup.TestContext) =>
        !pathInputFields.some(({ name }) => name === path) || (!!value && value.trim() !== '');

    const form = useForm<Explorer>({
        validation: yup.object({
            base: yup.string().test('format', invalidValueMessage, isValidUrl),
            tx: yup.string().test('format', invalidValueMessage, isValidPath),
            address: yup.string().test('format', invalidValueMessage, isValidPath),
            nft: yup.string().test('format', invalidValueMessage, isValidPath),
            token: yup.string().test('format', invalidValueMessage, isValidPath),
            queryString: yup.string(),
        }),
        defaultValues: networkExplorers.custom ?? networkExplorers.default,
        mode: 'onSubmit',
    });
    const { isDirty } = form.formState;

    const submit = form.handleSubmit(values => {
        dispatch(setNetworkExplorerThunk({ symbol, explorer: values }));
        form.reset(values);
        Keyboard.dismiss();
    });

    const setToDefault = () => {
        dispatch(setNetworkExplorerThunk({ symbol }));
        form.reset(networkExplorers.default);
        Keyboard.dismiss();
    };

    return {
        hookForm: form,
        pathInputFields,
        isDirty,
        isDefault: networkExplorers.custom === undefined,
        submit,
        setToDefault,
    };
};

export type NetworkExplorerForm = ReturnType<typeof useNetworkExplorerForm>;
