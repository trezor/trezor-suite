import { type FunctionComponent } from 'react';

import { SignVerify } from '@suite/sign-verify';
import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import {
    type SignEthereumMessageDep,
    type VerifyEthereumMessageDep,
} from '@trezor/network-ethereum-suite-common';
import { type EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-types';

export type EthereumSignVerifyComponentDeps = SignEthereumMessageDep &
    VerifyEthereumMessageDep &
    SignVerifyReporterDep;

export type EthereumSignVerifyComponent = FunctionComponent<SignVerifyProps<EthereumNetworkSymbol>>;

export const createEthereumSignVerifyComponent =
    (deps: EthereumSignVerifyComponentDeps): EthereumSignVerifyComponent =>
    ({ account }) => {
        const { symbol } = account;
        const accountAddress = { path: account.path, address: account.descriptor };

        return (
            <SignVerify>
                <SignVerify.Tabs>
                    <SignVerify.Tab page="sign" />
                    <SignVerify.Tab page="verify" />
                </SignVerify.Tabs>
                <SignVerify.SignForm
                    defaultAddress={accountAddress}
                    sign={({ device, message, hex }) =>
                        deps.signVerifyReporter.signAndReport(
                            { device, symbol, hex },
                            readyDevice =>
                                deps.signEthereumMessage({
                                    device: readyDevice,
                                    path: account.path,
                                    message,
                                    hex,
                                }),
                        )
                    }
                >
                    <SignVerify.AddressSelect addressGroups={[{ addresses: [accountAddress] }]} />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.SignForm>
                <SignVerify.VerifyForm
                    symbol={symbol}
                    verify={({ device, address, message, signature, hex }) =>
                        deps.signVerifyReporter.verifyAndReport(
                            { device, symbol, hex },
                            readyDevice =>
                                deps.verifyEthereumMessage({
                                    device: readyDevice,
                                    address,
                                    message,
                                    signature,
                                    hex,
                                }),
                        )
                    }
                >
                    <SignVerify.AddressInput />
                    <SignVerify.Message />
                    <SignVerify.Signature />
                </SignVerify.VerifyForm>
            </SignVerify>
        );
    };
