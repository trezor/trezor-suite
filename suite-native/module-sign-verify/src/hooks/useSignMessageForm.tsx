import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { MAX_LENGTH_MESSAGE, getHasSelectableSignatureFormat } from '@suite-common/sign-verify';
import { yup } from '@suite-common/validators';
import { type Account } from '@suite-common/wallet-types';
import { getStakingPath, isUtxoBased } from '@suite-common/wallet-utils';
import { Badge, type SelectItemType } from '@suite-native/atoms';
import { useForm, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { type SignatureFormat, useSignMessage } from './useSignMessage';

type FormValues = {
    format: SignatureFormat;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
};

export const useSignMessageForm = (account: Account) => {
    const isAddressBased = !isUtxoBased(account);
    const isCardano = account.networkType === 'cardano';

    const signMessage = useSignMessage();
    const { AddressFormatter } = useFormatters();
    const { translate } = useTranslate();

    const [isSigned, setIsSigned] = useState(false);

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
        const formatAddress = (address: string) =>
            AddressFormatter.format(address, { format: 'long' });

        if (isAddressBased) {
            return [
                {
                    value: account.descriptor,
                    label: formatAddress(account.descriptor),
                    path: account.path,
                },
            ];
        }

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
                label: formatAddress(address),
                badge,
                path,
            })),
        );
    }, [translate, isAddressBased, isCardano, account, AddressFormatter]);

    const form = useForm<FormValues>({
        validation: yup.object({
            format: yup.string<SignatureFormat>().required(),
            address: yup.string().required(),
            message: yup
                .string()
                .required()
                .max(MAX_LENGTH_MESSAGE)
                .when('hex', {
                    is: true,
                    then: schema => schema.isHex(),
                }),
            hex: yup.boolean().required(),
        }),
        defaultValues: {
            format: 'default',
            address: isAddressBased ? addresses[0]?.value : '',
            message: '',
            hex: false,
            signature: '',
        },
        mode: 'onSubmit',
    });

    const formValues = {
        message: useWatch({ control: form.control, name: 'message' }),
        hex: useWatch({ control: form.control, name: 'hex' }),
    };

    const setFormat = (format: SignatureFormat) => {
        form.setValue('format', format);
    };

    const setAddress = (address: string) => {
        form.setValue('address', address, { shouldValidate: true });
    };

    const setHex = (hex: boolean) => {
        form.setValue('hex', hex);
        if (formValues.message) {
            form.trigger('message');
        }
    };

    const submit = form.handleSubmit(async ({ format, address, message, hex }) => {
        const signResult = await signMessage({
            account,
            format,
            path: addresses.find(({ value }) => value === address)?.path ?? '',
            message,
            hex,
        });
        if (signResult) {
            form.setValue('signature', signResult.signature);
            setIsSigned(true);
        }
    });

    const clear = () => {
        form.reset();
        setIsSigned(false);
    };

    return {
        hookForm: form,
        formats,
        setFormat,
        addresses,
        setAddress,
        hex: formValues.hex,
        setHex,
        submit,
        clear,
        isSigned,
    };
};

export type SignMessageForm = ReturnType<typeof useSignMessageForm>;
