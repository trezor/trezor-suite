import type { GetTrezorConnectDep } from '@trezor/connect-common';
import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import {
    type AccountType,
    type MessageSigning,
    type NetworkDescription,
    type OpenAccountAddresses,
    defineMessageSigning,
    getFreshAddresses,
    groupSignAddresses,
    isAccountOfNetwork,
} from '@trezor/network-module-suite-common-types';
import { MessagesSchema } from '@trezor/protobuf';
import { err, ok } from '@trezor/type-utils';
import { hasProp } from '@trezor/utils';

import { cardanoMessageSigningLabels as labels } from './cardanoMessageSigningLabels';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '../cardanoAddressing';

export type CardanoMessageSigningDeps = GetTrezorConnectDep<'cardanoSignMessage'>;

type CardanoSigningAccount = {
    readonly symbol: CardanoNetworkSymbol;
    readonly index: number;
    readonly accountType: AccountType;
    readonly stakingAddress: string;
    readonly addresses?: OpenAccountAddresses;
};

type CardanoSignFormat = 'default' | 'cose';

/** The stake address lives in the account's network-specific data, which only Cardano knows. */
const getStakingAddress = (misc: unknown): string | undefined => {
    if (!hasProp(misc, 'staking') || !hasProp(misc.staking, 'address')) {
        return undefined;
    }

    return typeof misc.staking.address === 'string' ? misc.staking.address : undefined;
};

const getMessagePayload = (message: string, isHex: boolean) =>
    isHex ? message : Buffer.from(message, 'utf8').toString('hex');

const getSigningAddressParameters = (account: CardanoSigningAccount, path: string) => {
    const stakingPath = getStakingPath(account);

    return path === stakingPath
        ? { addressType: MessagesSchema.CardanoAddressType.REWARD, stakingPath }
        : getAddressParameters(account, path);
};

type CardanoMessageSigning = MessageSigning;

export const createCardanoMessageSigning = (
    deps: CardanoMessageSigningDeps,
    network: NetworkDescription<CardanoNetworkSymbol>,
): CardanoMessageSigning =>
    defineMessageSigning<CardanoSigningAccount, CardanoSignFormat>({
        labels: { title: labels.title },
        addressSelection: 'pick',
        outputs: ['signature', 'publicKey'],
        toAccount: account => {
            const stakingAddress = getStakingAddress(account.misc);

            return isAccountOfNetwork(account, network) && stakingAddress !== undefined
                ? {
                      symbol: network.symbol,
                      index: account.index,
                      accountType: account.accountType,
                      stakingAddress,
                      addresses: account.addresses,
                  }
                : undefined;
        },
        formats: {
            kind: 'publicKey',
            label: labels.format,
            options: { default: labels.formatDefault, cose: labels.formatCose },
            getAvailable: () => ['default', 'cose'],
        },
        getSignAddressGroups: (account, touchedAddresses) =>
            groupSignAddresses([
                {
                    label: labels.stakingAddress,
                    addresses: [{ path: getStakingPath(account), address: account.stakingAddress }],
                },
                {
                    label: labels.freshAddresses,
                    addresses: getFreshAddresses(account.addresses, touchedAddresses),
                },
                {
                    label: labels.usedAddresses,
                    addresses: (account.addresses?.used ?? []).toReversed(),
                },
                {
                    label: labels.changeAddresses,
                    addresses: (account.addresses?.change ?? []).toReversed(),
                },
            ]),
        sign: async ({ device, account, path, message, isHex, format }) => {
            const response = await deps.getTrezorConnect().cardanoSignMessage({
                device,
                path,
                payload: getMessagePayload(message, isHex),
                addressParameters: getSigningAddressParameters(account, path),
                protocolMagic: getProtocolMagic(account.symbol),
                networkId: getNetworkId(),
                derivationType: getDerivationType(account.accountType),
            });

            return response.success
                ? ok({
                      signature: response.payload.coseSignature,
                      publicKey:
                          format === 'cose' ? response.payload.coseKey : response.payload.pubKey,
                      address: response.payload.headers.protected.address,
                  })
                : err(response.error);
        },
    });
