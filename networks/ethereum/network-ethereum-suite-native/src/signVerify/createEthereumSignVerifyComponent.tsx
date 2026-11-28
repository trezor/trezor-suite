import { type FunctionComponent } from 'react';

import { type SignVerifyReporterDep, getReadyDevice } from '@suite-common/sign-verify';
import { SignVerify } from '@suite-native/sign-verify';
import {
    type SignEthereumMessageDep,
    type VerifyEthereumMessageDep,
} from '@trezor/network-ethereum-suite-common';
import { type EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import type { SignVerifyProps } from '@trezor/network-module-suite-native-types';

export type EthereumSignVerifyComponentDeps = SignEthereumMessageDep &
    VerifyEthereumMessageDep &
    SignVerifyReporterDep;

export type EthereumSignVerifyComponent = FunctionComponent<SignVerifyProps<EthereumNetworkSymbol>>;

export const createEthereumSignVerifyComponent =
    (deps: EthereumSignVerifyComponentDeps): EthereumSignVerifyComponent =>
    ({ networkSymbol, account }) => (
        <SignVerify>
            <SignVerify.Tabs pages={['sign', 'verify']} />
            <SignVerify.SignForm
                defaultAddress={{ address: account.descriptor, path: account.path }}
                sign={async ({ device, path, message, hex }) => {
                    const readyDevice = getReadyDevice(device, 'signMessage');
                    const result = readyDevice.success
                        ? await deps.signEthereumMessage({
                              device: readyDevice.payload,
                              path,
                              message,
                              hex,
                          })
                        : readyDevice;
                    deps.signVerifyReporter.reportSign({ symbol: networkSymbol, hex }, result);

                    return result;
                }}
            >
                <SignVerify.AddressSelect
                    addressGroups={[
                        { addresses: [{ address: account.descriptor, path: account.path }] },
                    ]}
                />
                <SignVerify.Message />
                <SignVerify.Signature />
            </SignVerify.SignForm>
            <SignVerify.VerifyForm
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
                    deps.signVerifyReporter.reportVerify({ symbol: networkSymbol, hex }, result);

                    return result;
                }}
            >
                <SignVerify.AddressInput />
                <SignVerify.Message />
                <SignVerify.Signature />
            </SignVerify.VerifyForm>
        </SignVerify>
    );
