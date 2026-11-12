import type { GetTrezorConnectDep } from '@trezor/connect-common';
import type { CardanoNetworkSymbol } from '@trezor/network-cardano-types';
import {
    type AccountType,
    type FamilyMessageSigning,
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

/** Cardano's own signing parameters: how the returned public key is encoded. */
export type CardanoSignParams = {
    readonly publicKeyFormat: 'raw' | 'cose';
};

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

export type CardanoMessageSigning = FamilyMessageSigning<CardanoSignParams>;

export const createCardanoMessageSigning = (
    deps: CardanoMessageSigningDeps,
    network: NetworkDescription<CardanoNetworkSymbol>,
): CardanoMessageSigning =>
    defineMessageSigning<CardanoSigningAccount, CardanoSignParams>({
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
        params: {
            publicKeyFormat: {
                kind: 'publicKey',
                label: labels.format,
                getOptions: () => [
                    { id: 'raw', label: labels.formatDefault, value: 'raw' },
                    { id: 'cose', label: labels.formatCose, value: 'cose' },
                ],
            },
        },
        getSignAddressGroups: (account, touchedAddresses) =>
            groupSignAddresses([
                {
                    category: 'staking',
                    label: labels.stakingAddress,
                    addresses: [{ path: getStakingPath(account), address: account.stakingAddress }],
                },
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
        sign: async ({ device, account, path, message, isHex, publicKeyFormat }) => {
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
                          publicKeyFormat === 'cose'
                              ? response.payload.coseKey
                              : response.payload.pubKey,
                      address: response.payload.headers.protected.address,
                  })
                : err(response.error);
        },
    });
