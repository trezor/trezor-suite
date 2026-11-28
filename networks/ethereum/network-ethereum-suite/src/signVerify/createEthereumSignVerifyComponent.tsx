import { type FunctionComponent } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import {
    EMPTY_VALUES,
    SignVerify,
    type SignVerifyValues,
    createVerifySchema,
    signSchema,
} from '@suite/sign-verify';
import { type SignVerifyReporterDep, getReadyDevice } from '@suite-common/sign-verify';
import {
    type SignEthereumMessageDep,
    type VerifyEthereumMessageDep,
    ethereumValidator,
} from '@trezor/network-ethereum-suite-common';
import { type EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-types';

export type EthereumSignVerifyComponentDeps = SignEthereumMessageDep &
    VerifyEthereumMessageDep &
    SignVerifyReporterDep;

export type EthereumSignVerifyComponent = FunctionComponent<SignVerifyProps<EthereumNetworkSymbol>>;

export const createEthereumSignVerifyComponent =
    (deps: EthereumSignVerifyComponentDeps): EthereumSignVerifyComponent =>
    ({ networkSymbol, account }) => {
        const accountAddress = { path: account.path, address: account.descriptor };

        const signForm = useForm<SignVerifyValues>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
            resolver: zodResolver(signSchema),
            defaultValues: { ...EMPTY_VALUES, ...accountAddress },
        });
        const verifyForm = useForm<SignVerifyValues>({
        mode: 'onBlur',
        reValidateMode: 'onChange',
            resolver: zodResolver(
                createVerifySchema(address => ethereumValidator.isAddressValid(networkSymbol, address)),
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
                    sign={async ({ device, message, hex }) => {
                        const readyDevice = getReadyDevice(device, 'signMessage');
                        const result = readyDevice.success
                            ? await deps.signEthereumMessage({
                                  device: readyDevice.payload,
                                  path: account.path,
                                  message,
                                  hex,
                              })
                            : readyDevice;
                        deps.signVerifyReporter.reportSign({ symbol: networkSymbol, hex }, result);

                        return result;
                    }}
                >
                    <SignVerify.AddressSelect addressGroups={[{ addresses: [accountAddress] }]} isFixed />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.SignForm>
                <SignVerify.VerifyForm
                    form={verifyForm}
                    verify={async ({ device, address, message, signature, hex }) => {
                        const readyDevice = getReadyDevice(device, 'verifyMessage');
                        const result = readyDevice.success
                            ? await deps.verifyEthereumMessage({
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
