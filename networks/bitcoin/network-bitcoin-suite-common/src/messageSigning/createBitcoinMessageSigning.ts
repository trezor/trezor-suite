import { type GetTrezorConnectDep, asCoinSymbol } from '@trezor/connect-common';
import type { BitcoinNetworkSymbol } from '@trezor/network-bitcoin-types';
import {
    type MessageSigning,
    type NetworkDescription,
    type OpenAccountAddresses,
    defineMessageSigning,
    getFreshAddresses,
    groupSignAddresses,
    isAccountOfNetwork,
} from '@trezor/network-module-suite-common-types';
import { err, ok } from '@trezor/type-utils';

import { bitcoinMessageSigningLabels as labels } from './bitcoinMessageSigningLabels';

export type BitcoinMessageSigningDeps = GetTrezorConnectDep<
    'getAddress' | 'signMessage' | 'verifyMessage'
>;

type BitcoinSigningAccount = {
    readonly symbol: BitcoinNetworkSymbol;
    readonly addresses?: OpenAccountAddresses;
    readonly hasSelectableFormat: boolean;
};

type BitcoinSignFormat = 'default' | 'electrum';

type BitcoinMessageSigning = MessageSigning;

export const createBitcoinMessageSigning = (
    deps: BitcoinMessageSigningDeps,
    network: NetworkDescription<BitcoinNetworkSymbol>,
): BitcoinMessageSigning =>
    defineMessageSigning<BitcoinSigningAccount, BitcoinSignFormat>({
        labels: { title: labels.title },
        addressSelection: 'pick',
        outputs: ['signature'],
        toAccount: account =>
            isAccountOfNetwork(account, network)
                ? {
                      symbol: network.symbol,
                      addresses: account.addresses,
                      // Legacy accounts and networks with a single account type sign the same way
                      // in both formats, so offering the choice would only invent a difference.
                      hasSelectableFormat:
                          account.accountType !== 'legacy' &&
                          Object.keys(network.config.accountTypes).length > 0,
                  }
                : undefined,
        formats: {
            kind: 'signature',
            label: labels.format,
            tooltip: labels.formatTooltip,
            options: { default: labels.formatDefault, electrum: labels.formatElectrum },
            getAvailable: account => (account.hasSelectableFormat ? ['default', 'electrum'] : []),
        },
        getSignAddressGroups: (account, touchedAddresses) =>
            groupSignAddresses([
                {
                    category: 'fresh',
                    label: labels.freshAddresses,
                    addresses: getFreshAddresses(account.addresses, touchedAddresses),
                },
                {
                    category: 'used',
                    label: labels.usedAddresses,
                    addresses: (account.addresses?.used ?? []).toReversed(),
                },
                {
                    category: 'change',
                    label: labels.changeAddresses,
                    addresses: (account.addresses?.change ?? []).toReversed(),
                },
            ]),
        sign: async ({ device, account, path, message, isHex, format }) => {
            const response = await deps.getTrezorConnect().signMessage({
                device,
                path,
                coin: asCoinSymbol(account.symbol),
                message,
                hex: isHex,
                no_script_type: format === 'electrum',
            });

            return response.success
                ? ok({ signature: response.payload.signature, address: response.payload.address })
                : err(response.error);
        },
        verify: async ({ device, account, address, message, signature, isHex }) => {
            const response = await deps.getTrezorConnect().verifyMessage({
                device,
                address,
                coin: asCoinSymbol(account.symbol),
                message,
                signature,
                hex: isHex,
            });

            return response.success ? ok() : err(response.error);
        },
        showAddress: async ({ device, account, address, path, isChunkified }) => {
            const response = await deps.getTrezorConnect().getAddress({
                device,
                address,
                path,
                coin: asCoinSymbol(account.symbol),
                chunkify: isChunkified,
            });

            return response.success
                ? ok({ address: response.payload.address, path })
                : err(response.error);
        },
    });
