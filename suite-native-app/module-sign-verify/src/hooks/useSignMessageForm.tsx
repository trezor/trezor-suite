import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { MAX_LENGTH_MESSAGE, injectSignVerify } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Badge, type SelectItemType } from '@suite-native/atoms';
import { useForm, useWatch, yup } from '@suite-native/forms';
import { type TxKeyPath, useTranslate } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { getStakingPath } from '@trezor/network-cardano-suite-common';
import { type SignatureFormat } from '@trezor/network-module-suite-common-types';
import { isHex } from '@trezor/utils';

import { useSignMessage } from './useSignMessage';

// TODO: Hack: the app labels every network's signature formats itself instead of the network
// providing the labels. Remove as https://github.com/trezor/trezor-suite/issues/32472
// progresses.
const FORMAT_LABELS: Record<SignatureFormat, TxKeyPath> = {
    trezor: 'signAndVerify.format.values.trezor',
    electrum: 'signAndVerify.format.values.electrum',
    raw: 'signAndVerify.format.values.rawKey',
    cose: 'signAndVerify.format.values.cose',
};

type FormValues = {
    format?: SignatureFormat;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
};

export const useSignMessageForm = (account: Account) => {
    const isAddressBased = !isUtxoBased(account);
    const isCardano = account.networkType === 'cardano';

    const signMessage = useSignMessage();
    const { signVerify } = useServices(injectSignVerify);
    const { AddressFormatter } = useFormatters();
    const { translate } = useTranslate();

    const [isSigned, setIsSigned] = useState(false);

    const formats = useMemo((): SelectItemType<SignatureFormat>[] | undefined => {
        const signatureFormats = signVerify.getFormats(account);

        if (signatureFormats.length > 1) {
            return signatureFormats.map(format => ({
                value: format,
                label: translate(FORMAT_LABELS[format]),
            }));
        }
    }, [translate, signVerify, account]);

    const addresses = useMemo((): (SelectItemType<string> & { path: string })[] => {
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
            format: yup.string<SignatureFormat>(),
            address: yup.string().required(),
            message: yup
                .string()
                .required()
                .max(MAX_LENGTH_MESSAGE)
                .when('hex', {
                    is: true,
                    then: schema =>
                        schema.test('isHex', translate('signAndVerify.hex.invalid'), value =>
                            isHex(value, { prefix: 'optional', allowEmpty: false }),
                        ),
                }),
            hex: yup.boolean().required(),
        }),
        defaultValues: {
            format: signVerify.getDefaultFormat(account),
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
