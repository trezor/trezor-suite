import type { GetTrezorConnectDep } from '@trezor/connect-common';
import type { EthereumNetworkSymbol } from '@trezor/network-ethereum-types';
import {
    type MessageSigning,
    type NetworkDescription,
    defineMessageSigning,
    isAccountOfNetwork,
} from '@trezor/network-module-suite-common-types';
import { err, ok } from '@trezor/type-utils';

import { ethereumMessageSigningLabels as labels } from './ethereumMessageSigningLabels';

export type EthereumMessageSigningDeps = GetTrezorConnectDep<
    'ethereumGetAddress' | 'ethereumSignMessage' | 'ethereumVerifyMessage'
>;

type EthereumSigningAccount = {
    readonly path: string;
    readonly address: string;
};

type EthereumMessageSigning = MessageSigning;

/** Every EVM chain signs with the one account address, so there is nothing to choose. */
export const createEthereumMessageSigning = (
    deps: EthereumMessageSigningDeps,
    network: NetworkDescription<EthereumNetworkSymbol>,
): EthereumMessageSigning =>
    defineMessageSigning<EthereumSigningAccount>({
        labels: { title: labels.title },
        addressSelection: 'fixed',
        outputs: ['signature'],
        toAccount: account =>
            isAccountOfNetwork(account, network)
                ? { path: account.path, address: account.descriptor }
                : undefined,
        getSignAddressGroups: account => [
            {
                category: 'account',
                label: null,
                addresses: [{ path: account.path, address: account.address }],
            },
        ],
        sign: async ({ device, path, message, isHex }) => {
            const response = await deps.getTrezorConnect().ethereumSignMessage({
                device,
                path,
                message,
                hex: isHex,
            });

            return response.success
                ? ok({ signature: response.payload.signature, address: response.payload.address })
                : err(response.error);
        },
        verify: async ({ device, address, message, signature, isHex }) => {
            const response = await deps.getTrezorConnect().ethereumVerifyMessage({
                device,
                address,
                message,
                signature,
                hex: isHex,
            });

            return response.success ? ok() : err(response.error);
        },
        showAddress: async ({ device, address, path, isChunkified }) => {
            const response = await deps.getTrezorConnect().ethereumGetAddress({
                device,
                address,
                path,
                chunkify: isChunkified,
            });

            return response.success
                ? ok({ address: response.payload.address, path })
                : err(response.error);
        },
    });
