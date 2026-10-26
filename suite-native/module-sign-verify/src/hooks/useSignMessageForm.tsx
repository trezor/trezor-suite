import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { MAX_LENGTH_MESSAGE } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { type SelectItemType } from '@suite-native/atoms';
import { useForm, useWatch, yup } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import type { SignFormat } from '@trezor/network-module-suite-common-types';
import { isHex } from '@trezor/utils';

import { useAccountMessageSigning } from './useAccountMessageSigning';
import { useSignMessage } from './useSignMessage';
import { useMessageSigningLabels } from '../messageSigningLabels';

type FormValues = {
    format?: SignFormat;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
};

export const useSignMessageForm = (account: Account) => {
    const messageSigning = useAccountMessageSigning(account);
    const isAddressFixed = messageSigning?.addressSelection === 'fixed';

    const signMessage = useSignMessage();
    const { AddressFormatter } = useFormatters();
    const { translate } = useTranslate();
    const { getFormatLabel, addressBadges } = useMessageSigningLabels();

    const [isSigned, setIsSigned] = useState(false);

    const formatChoice = useMemo(
        () => messageSigning?.getFormatChoice(account) ?? null,
        [messageSigning, account],
    );

    const formats = useMemo(
        (): SelectItemType<SignFormat>[] | undefined =>
            formatChoice?.options.map(option => ({
                value: option.format,
                label: getFormatLabel(formatChoice.kind, option),
            })),
        [formatChoice, getFormatLabel],
    );

    const addresses = useMemo((): (SelectItemType<string> & { path: string })[] => {
        const groups =
            messageSigning?.getSignAddressGroups({ account, touchedAddresses: [] }) ?? [];

        return groups.flatMap(group =>
            group.addresses.map(({ address, path }) => ({
                value: address,
                label: AddressFormatter.format(address, { format: 'long' }),
                badge: addressBadges[group.category],
                path,
            })),
        );
    }, [messageSigning, account, AddressFormatter, addressBadges]);

    const form = useForm<FormValues>({
        validation: yup.object({
            format: yup.mixed<SignFormat>(),
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
            format: formatChoice?.options[0]?.format,
            address: isAddressFixed ? addresses[0]?.value : '',
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

    const setFormat = (format: SignFormat) => {
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
