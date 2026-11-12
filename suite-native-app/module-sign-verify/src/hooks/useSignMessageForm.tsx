import { useMemo, useState } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { MAX_LENGTH_MESSAGE, useMessageSigning } from '@suite-common/sign-verify';
import { type Account } from '@suite-common/wallet-types';
import { type SelectItemType } from '@suite-native/atoms';
import { useForm, useWatch, yup } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import type { SignChoiceOptionId, SignSelection } from '@trezor/network-module-suite-common-types';
import { isHex } from '@trezor/utils';

import { useSignMessage } from './useSignMessage';
import { useMessageSigningLabels } from '../messageSigningLabels';

type FormValues = {
    /** Options picked from the network's choices, by choice key. */
    selection: SignSelection;
    address: string;
    message: string;
    hex: boolean;
    signature: string;
};

export const useSignMessageForm = (account: Account) => {
    const signing = useMessageSigning(account);
    const isAddressFixed = signing?.isAddressFixed ?? false;

    const signMessage = useSignMessage();
    const { AddressFormatter } = useFormatters();
    const { translate } = useTranslate();
    const { getLabel, addressBadges } = useMessageSigningLabels();

    const [isSigned, setIsSigned] = useState(false);

    const choices = useMemo(() => signing?.choices ?? [], [signing]);

    // Each choice of the family's own parameters, as a select over the options it offered.
    const choiceFields = useMemo(
        () =>
            choices.map(choice => ({
                key: choice.key,
                name: `selection.${choice.key}` as const,
                title: getLabel(choice.label),
                items: choice.options.map((option): SelectItemType<SignChoiceOptionId> => ({
                    value: option.id,
                    label: getLabel(option.label),
                })),
            })),
        [choices, getLabel],
    );

    const addresses = useMemo((): (SelectItemType<string> & { path: string })[] => {
        const groups = signing?.addressGroups ?? [];

        return groups.flatMap(group =>
            group.addresses.map(({ address, path }) => ({
                value: address,
                label: AddressFormatter.format(address, { format: 'long' }),
                badge: addressBadges[group.category],
                path,
            })),
        );
    }, [signing, AddressFormatter, addressBadges]);

    const form = useForm<FormValues>({
        validation: yup.object({
            selection: yup.mixed<SignSelection>().required(),
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
            selection: Object.fromEntries(
                choices.map(choice => [choice.key, choice.options[0]?.id]),
            ),
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

    const selectOption = (name: `selection.${string}`, id: SignChoiceOptionId) => {
        form.setValue(name, id);
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

    const submit = form.handleSubmit(async ({ selection, address, message, hex }) => {
        const signResult = await signMessage({
            account,
            selection,
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
        choiceFields,
        selectOption,
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
