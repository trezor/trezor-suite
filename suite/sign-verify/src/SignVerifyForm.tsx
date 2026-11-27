import { use } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { zodResolver } from '@hookform/resolvers/zod';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { type AddressValidator, injectAddressValidator } from '@suite-common/networks';
import {
    MAX_LENGTH_MESSAGE,
    type SignAddressGroup,
    type SignAddressesRootState,
    injectSignVerify,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import { type Network, type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Button, Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { getStakingPath } from '@trezor/network-cardano-suite-common';
import { type SignatureFormat } from '@trezor/network-module-suite-common-types';
import { exhaustive } from '@trezor/type-utils';
import { isHex, throwError } from '@trezor/utils';
import { z } from '@trezor/zod';

import { SignVerifyAddressInput } from './SignVerifyAddressInput';
import { SignVerifyAddressSelect } from './SignVerifyAddressSelect';
import { EMPTY_VALUES, SignVerifyContext, type SignVerifyValues } from './SignVerifyContext';
import { SignVerifyFormat } from './SignVerifyFormat';
import { SignVerifyMessage } from './SignVerifyMessage';
import { SignVerifyPublicKey } from './SignVerifyPublicKey';
import { SignVerifySignature } from './SignVerifySignature';

type SignVerifySchemaContext = {
    addressValidator: AddressValidator;
    isSignPage: boolean;
    symbol: NetworkSymbol;
};

const REQUIRED: TranslationKey = 'TR_REQUIRED_FIELD';

const requiredString = z.string().min(1, REQUIRED);

const createSignVerifySchema = ({
    addressValidator,
    isSignPage,
    symbol,
}: SignVerifySchemaContext) =>
    z
        .object({
            message: z
                .string()
                .max(MAX_LENGTH_MESSAGE, 'TR_TOO_LONG' satisfies TranslationKey)
                .min(1, REQUIRED),
            address: z
                .string()
                .refine(
                    value => addressValidator.isAddressValid(symbol, value),
                    'TR_ADD_TOKEN_ADDRESS_NOT_VALID' satisfies TranslationKey,
                ),
            path: isSignPage ? requiredString : z.string(),
            signature: isSignPage ? z.string() : requiredString,
            hex: z.boolean(),
            format: z.string(),
            pubKey: z.string(),
        })
        .refine(
            ({ message, hex }) =>
                !hex || message === '' || isHex(message, { prefix: 'optional', allowEmpty: false }),
            {
                message: 'DATA_NOT_VALID_HEX' satisfies TranslationKey,
                path: ['message'],
                // The hex check needs the Hex switch next to the message, so it must not wait for the other fields.
                when: () => true,
            },
        );

const FORMAT_LABELS: Record<SignatureFormat, TranslationKey> = {
    trezor: 'TR_BIP_SIG_FORMAT',
    electrum: 'TR_COMPATIBILITY_SIG_FORMAT',
    raw: 'TR_PUBLIC_KEY_RAW',
    cose: 'TR_PUBLIC_KEY_COSE',
};

const getAccountAddressGroups = (
    account: Account,
    signAddressGroups: SignAddressGroup[],
): SignAddressGroup[] => {
    switch (account.networkType) {
        // Ethereum signs with the account itself, it has no address list.
        case 'ethereum':
            return [{ addresses: [{ address: account.descriptor, path: account.path }] }];
        case 'cardano':
            return [
                {
                    category: 'stake',
                    addresses: [
                        { path: getStakingPath(account), address: account.misc.staking.address },
                    ],
                },
                ...signAddressGroups,
            ];
        default:
            return signAddressGroups;
    }
};

type SignVerifyFormProps = {
    account: Account;
    network?: Network;
};

export const SignVerifyForm = ({ account, network }: SignVerifyFormProps) => {
    const { page, outcome, setOutcome } =
        use(SignVerifyContext) ?? throwError('Missing SignVerify');

    const { signVerify } = useServices(injectSignVerify);
    const { addressValidator } = useServices(injectAddressValidator);
    const { device, isLocked } = useDevice();
    const signAddressGroups = useSelector((state: SignAddressesRootState) =>
        selectAccountSignAddresses(state, account),
    );

    const isSignPage = page === 'sign';
    const isEthereum = account.networkType === 'ethereum';
    const formats = signVerify.getFormats(account);
    const addressGroups = getAccountAddressGroups(account, signAddressGroups);
    const defaultAddress = isSignPage && isEthereum ? addressGroups[0]?.addresses[0] : undefined;

    const form = useForm<SignVerifyValues, SignVerifySchemaContext>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
        resolver: (values, context, options) =>
            zodResolver(
                createSignVerifySchema(context ?? throwError('Missing sign & verify context')),
            )(values, context, options),
        context: { addressValidator, isSignPage, symbol: account.symbol },
        defaultValues: {
            ...EMPTY_VALUES,
            path: defaultAddress?.path ?? '',
            address: defaultAddress?.address ?? '',
            format: signVerify.getDefaultFormat(account) ?? '',
        },
    });

    const clear = () => {
        form.reset();
        setOutcome(page, 'idle');
    };

    // A failed verification comes with no Clear button, editing the values is the way out.
    const leaveFailedOutcome = () => {
        if (outcome === 'failed') {
            setOutcome(page, 'idle');
        }
    };

    const onSubmit = async ({
        address,
        path,
        message,
        signature,
        hex,
        format,
    }: SignVerifyValues) => {
        if (isSignPage) {
            const result = await signVerify.sign({
                device,
                account,
                path,
                message,
                hex,
                format: formats.find(value => value === format),
            });

            if (result.success) {
                form.setValue('signature', result.payload.signature);
                form.setValue('pubKey', result.payload.pubKey ?? '');
                setOutcome(page, 'signed');
            }

            return;
        }

        const result = await signVerify.verify({
            device,
            account,
            address,
            message,
            signature,
            hex,
        });

        if (result.success) {
            setOutcome(page, 'verified');

            return;
        }

        switch (result.error.type) {
            // Cancelling on the device leaves the form exactly as it was, the way a cancelled
            // signing does: nothing was verified, and nothing failed to verify either.
            case 'DeviceCancelled':
                break;
            case 'DeviceError':
            case 'DeviceNotConnectedError':
            case 'SignVerifyNotSupported':
                setOutcome(page, 'failed');
                break;
            default:
                exhaustive(result.error);
        }
    };

    const isCompleted = outcome === 'signed' || outcome === 'verified';

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onChange={leaveFailedOutcome}>
                <Column gap={16} margin={{ bottom: 32 }}>
                    {isSignPage && formats.length > 1 && (
                        <SignVerifyFormat
                            options={formats.map(value => ({
                                value,
                                label: <Translation id={FORMAT_LABELS[value]} />,
                            }))}
                            tooltip={
                                formats.includes('electrum') ? (
                                    <Translation
                                        id="TR_FORMAT_TOOLTIP"
                                        values={{
                                            FormatDescription: chunks => <p>{chunks}</p>,
                                            span: chunks => <strong>{chunks}</strong>,
                                        }}
                                    />
                                ) : undefined
                            }
                        />
                    )}
                    {isSignPage ? (
                        <SignVerifyAddressSelect
                            addressGroups={addressGroups}
                            isFixed={isEthereum}
                        />
                    ) : (
                        <SignVerifyAddressInput />
                    )}
                    <SignVerifyMessage />
                    <SignVerifySignature />
                    {isSignPage && network?.networkType === 'cardano' && <SignVerifyPublicKey />}
                </Column>
                {/* Distinct keys: a reused <button> turns into the submit button during the Clear click, and the browser then submits the cleared form. */}
                {isCompleted ? (
                    <Button
                        key="clear"
                        type="button"
                        intent="neutral"
                        priority="secondary"
                        onClick={clear}
                        data-testid="@sign-verify/clear"
                        minWidth={200}
                    >
                        <Translation id="TR_CLEAR" />
                    </Button>
                ) : (
                    <Button
                        key="submit"
                        type="submit"
                        intent="brand"
                        isDisabled={isLocked()}
                        isLoading={form.formState.isSubmitting}
                        data-testid="@sign-verify/submit"
                        minWidth={200}
                    >
                        <Translation id={isSignPage ? 'TR_SIGN' : 'TR_VERIFY'} />
                    </Button>
                )}
            </form>
        </FormProvider>
    );
};
