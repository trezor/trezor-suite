import { useMemo, useState } from 'react';
import { Keyboard } from 'react-native';

import { useServices } from '@suite-common/dependency-injection';
import { useFormatters } from '@suite-common/formatters';
import { selectDispatch } from '@suite-common/redux-utils';
import { getHasSelectableSignatureFormat, signThunk } from '@suite-common/sign-verify';
import { yup } from '@suite-common/validators';
import { type Account } from '@suite-common/wallet-types';
import { getStakingPath } from '@suite-common/wallet-utils';
import { Badge, type SelectItemType } from '@suite-native/atoms';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

export type SignatureFormat = 'default' | 'electrum' | 'cose';
export type SignatureResult = 'signed' | 'failed';

type FormValues = {
    format: SignatureFormat;
    address: string;
    message: string;
    signature: string;
};

export const useSignMessageForm = (account: Account) => {
    const isCardano = account.networkType === 'cardano';

    const { dispatch } = useServices(selectDispatch);
    const { AddressFormatter } = useFormatters();
    const { translate } = useTranslate();

    const [isMessageHex, setIsMessageHex] = useState(false);
    const [result, setResult] = useState<SignatureResult>();

    const formats = useMemo((): SelectItemType<SignatureFormat>[] | undefined => {
        if (getHasSelectableSignatureFormat(account)) {
            return [
                { value: 'default', label: translate('signAndVerify.format.values.trezor') },
                { value: 'electrum', label: translate('signAndVerify.format.values.electrum') },
            ];
        }
        if (isCardano) {
            return [
                { value: 'default', label: translate('signAndVerify.format.values.rawKey') },
                { value: 'cose', label: translate('signAndVerify.format.values.cose') },
            ];
        }
    }, [translate, account, isCardano]);

    const addresses = useMemo(() => {
        const addressGroups = [
            {
                items: isCardano
                    ? [{ address: account.misc?.staking?.address, path: getStakingPath(account) }]
                    : [],
                badge: (
                    <Badge label={translate('signAndVerify.address.badges.stake')} intent="info" />
                ),
            },
            {
                items: account.addresses?.unused?.slice(0, 1) ?? [],
                badge: (
                    <Badge label={translate('signAndVerify.address.badges.fresh')} intent="brand" />
                ),
            },
            {
                items: account.addresses?.used.slice().reverse() ?? [],
            },
            {
                items: account.addresses?.change.slice().reverse() ?? [],
                badge: <Badge label={translate('signAndVerify.address.badges.change')} />,
            },
        ];

        return addressGroups.flatMap(({ items, badge }) =>
            items.map(({ address, path }) => ({
                value: address,
                label: AddressFormatter.format(address, { format: 'long' }),
                badge,
                path,
            })),
        );
    }, [translate, isCardano, account, AddressFormatter]);

    // const pathInputFields = useMemo(() => {
    //     const allInputFields: PathInputField[] = [
    //         { name: 'tx', label: 'moduleSettings.networkBackends.explorer.labels.tx' },
    //         { name: 'address', label: 'moduleSettings.networkBackends.explorer.labels.address' },
    //         { name: 'nft', label: 'moduleSettings.networkBackends.explorer.labels.nft' },
    //         { name: 'token', label: 'moduleSettings.networkBackends.explorer.labels.token' },
    //         {
    //             name: 'queryString',
    //             label: 'moduleSettings.networkBackends.explorer.labels.queryString',
    //         },
    //     ];
    //
    //     return allInputFields.filter(({ name }) => networkExplorers.default[name] !== undefined);
    // }, [networkExplorers.default]);

    // const invalidValueMessage = translate('moduleSettings.networkBackends.explorer.invalidValue');
    // const isValidUrl = (value?: string) => !!value && isUrl(value);
    // const isValidPath = (value: string | undefined, { path }: yup.TestContext) =>
    //     !pathInputFields.some(({ name }) => name === path) || (!!value && value.trim() !== '');

    const form = useForm<FormValues>({
        validation: yup.object({
            format: yup.string<SignatureFormat>().required(),
            address: yup.string().required(),
            message: yup.string().required(),
        }),
        defaultValues: {
            format: 'default',
            address: '',
            message: '',
            signature: '',
        },
        mode: 'onSubmit',
    });

    const selectedFormat = useWatch({ control: form.control, name: 'format' });
    const selectedAddress = useWatch({ control: form.control, name: 'address' });

    const setFormat = (format: SignatureFormat) => {
        form.setValue('format', format);
    };

    const setAddress = (address: string) => {
        form.setValue('address', address, { shouldValidate: true });
    };

    const toggleMessageHex = () => {
        setIsMessageHex(!isMessageHex);
    };

    const submit = form.handleSubmit(async ({ format, address, message }) => {
        Keyboard.dismiss();
        const result = await dispatch(
            signThunk(
                account,
                addresses.find(({ value }) => value === address)?.path ?? '',
                message,
                isMessageHex,
                format === 'electrum',
                format === 'cose',
            ),
        );
        console.log('result', result);
        if (result) {
            form.setValue('signature', result.signature);
            setResult('signed');
        }
        // TODO: fix me!
    });

    return {
        hookForm: form,
        formats,
        selectedFormat,
        setFormat,
        addresses,
        selectedAddress,
        setAddress,
        isMessageHex,
        toggleMessageHex,
        submit,
        result,
    };
};

export type SignMessageForm = ReturnType<typeof useSignMessageForm>;
