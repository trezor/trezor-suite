import { CARDANO } from '@trezor/connect-common';
import type { AccountType } from '@trezor/network-module-suite-common-types';
import { MessagesSchema } from '@trezor/protobuf';

type CardanoAccountIndex = { readonly index: number };

export const getDerivationType = (accountType: AccountType) => {
    switch (accountType) {
        case 'normal':
            return 1;
        case 'legacy':
            return 2;
        case 'ledger':
            return 0;
        default:
            return 1;
    }
};

export const getStakingPath = (account: CardanoAccountIndex) =>
    `m/1852'/1815'/${account.index}'/2/0`;

export const getProtocolMagic = (symbol: string) =>
    // TODO: use testnet magic from connect once this PR is merged https://github.com/trezor/connect/pull/1046
    symbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getAddressType = () => MessagesSchema.CardanoAddressType.BASE;

export const getNetworkId = () => CARDANO.NETWORK_IDS.mainnet;

export const getAddressParameters = (account: CardanoAccountIndex, path: string) => ({
    path,
    addressType: getAddressType(),
    stakingPath: getStakingPath(account),
});
