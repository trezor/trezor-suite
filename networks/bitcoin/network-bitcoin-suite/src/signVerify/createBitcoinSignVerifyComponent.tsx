import { type FunctionComponent } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { zodResolver } from '@hookform/resolvers/zod';

import { Translation, type TranslationKey } from '@suite/intl';
import {
    EMPTY_VALUES,
    SignVerify,
    type SignVerifyValues,
    createVerifySchema,
    signSchema,
} from '@suite/sign-verify';
import {
    type SignAddressesRootState,
    type SignVerifyReporterDep,
    getReadyDevice,
    selectAccountSignAddresses,
} from '@suite-common/sign-verify';
import {
    BITCOIN_DEFAULT_SIGNATURE_FORMAT,
    type BitcoinSignatureFormat,
    type SignBitcoinMessageDep,
    type VerifyBitcoinMessageDep,
    bitcoinValidator,
    getBitcoinSignatureFormats,
} from '@trezor/network-bitcoin-suite-common';
import { type BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-types';

const FORMAT_LABELS: Record<BitcoinSignatureFormat, TranslationKey> = {
    trezor: 'TR_BIP_SIG_FORMAT',
    electrum: 'TR_COMPATIBILITY_SIG_FORMAT',
};

export type BitcoinSignVerifyComponentDeps = SignBitcoinMessageDep &
    VerifyBitcoinMessageDep &
    SignVerifyReporterDep;

export type BitcoinSignVerifyComponent = FunctionComponent<SignVerifyProps<BitcoinNetworkSymbol>>;

export const createBitcoinSignVerifyComponent =
    (deps: BitcoinSignVerifyComponentDeps): BitcoinSignVerifyComponent =>
    ({ networkSymbol, account }) => {
        const addressGroups = useSelector((state: SignAddressesRootState) =>
            selectAccountSignAddresses(state, account),
        );

        const formats = getBitcoinSignatureFormats(networkSymbol, account.accountType);
        const isFormatSelectable = formats.length > 1;

        const signForm = useForm<SignVerifyValues>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
            resolver: zodResolver(signSchema),
            defaultValues: { ...EMPTY_VALUES, format: BITCOIN_DEFAULT_SIGNATURE_FORMAT },
        });
        const verifyForm = useForm<SignVerifyValues>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
            resolver: zodResolver(
                createVerifySchema(address => bitcoinValidator.isAddressValid(networkSymbol, address)),
            ),
            defaultValues: EMPTY_VALUES,
        });

        return (
            <SignVerify>
                <SignVerify.Tabs>
                    <SignVerify.Tab page="sign" />
                    <SignVerify.Tab page="verify" />
                </SignVerify.Tabs>
                <SignVerify.SignForm
                    form={signForm}
                    sign={async ({ device, path, message, hex, format }) => {
                        const selectedFormat = formats.find(value => value === format);
                        const readyDevice = getReadyDevice(device, 'signMessage');
                        const result = readyDevice.success
                            ? await deps.signBitcoinMessage(networkSymbol, {
                                  device: readyDevice.payload,
                                  path,
                                  message,
                                  hex,
                                  format: selectedFormat ?? BITCOIN_DEFAULT_SIGNATURE_FORMAT,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportSign(
                            {
                                symbol: networkSymbol,
                                hex,
                                // Only an account offering the choice reports the picked format.
                                signatureFormat: selectedFormat,
                            },
                            result,
                        );

                        return result;
                    }}
                >
                    {isFormatSelectable && (
                        <SignVerify.Format
                            options={formats.map(value => ({
                                value,
                                label: <Translation id={FORMAT_LABELS[value]} />,
                            }))}
                            tooltip={
                                <Translation
                                    id="TR_FORMAT_TOOLTIP"
                                    values={{
                                        FormatDescription: chunks => <p>{chunks}</p>,
                                        span: chunks => <strong>{chunks}</strong>,
                                    }}
                                />
                            }
                        />
                    )}
                    <SignVerify.AddressSelect addressGroups={addressGroups} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.SignForm>
                <SignVerify.VerifyForm
                    form={verifyForm}
                    verify={async ({ device, address, message, signature, hex }) => {
                        const readyDevice = getReadyDevice(device, 'verifyMessage');
                        const result = readyDevice.success
                            ? await deps.verifyBitcoinMessage(networkSymbol, {
                                  device: readyDevice.payload,
                                  address,
                                  message,
                                  signature,
                                  hex,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportVerify(
                            { symbol: networkSymbol, hex },
                            result,
                        );

                        return result;
                    }}
                >
                    <SignVerify.AddressInput />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.VerifyForm>
            </SignVerify>
        );
    };
