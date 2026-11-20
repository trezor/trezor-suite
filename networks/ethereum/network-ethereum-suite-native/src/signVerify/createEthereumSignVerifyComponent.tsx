import { type FunctionComponent } from 'react';

import { type SignVerifyReporterDep } from '@suite-common/sign-verify';
import { SignVerifyForms } from '@suite-native/sign-verify';
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
    ({ account }) => {
        const { symbol } = account;

        return (
            <SignVerifyForms
                addressGroups={[
                    { addresses: [{ address: account.descriptor, path: account.path }] },
                ]}
                signMessage={({ device, path, message, hex }) =>
                    deps.signVerifyReporter.signAndReport({ device, symbol, hex }, readyDevice =>
                        deps.signEthereumMessage({ device: readyDevice, path, message, hex }),
                    )
                }
                verifyMessage={({ device, address, message, signature, hex }) =>
                    deps.signVerifyReporter.verifyAndReport({ device, symbol, hex }, readyDevice =>
                        deps.verifyEthereumMessage({
                            device: readyDevice,
                            address,
                            message,
                            signature,
                            hex,
                        }),
                    )
                }
            />
        );
    };
