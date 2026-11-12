import { CARDANO } from '@trezor/connect-common';
import type { AccountType } from '@trezor/network-module-suite-common-types';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

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

export const getStakingPath = (account: { index: number }) => `m/1852'/1815'/${account.index}'/2/0`;

export const getProtocolMagic = (symbol: string) =>
    // TODO: use testnet magic from connect once this PR is merged https://github.com/trezor/connect/pull/1046
    symbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getAddressType = () => PROTO.CardanoAddressType.BASE;

export const getNetworkId = () => CARDANO.NETWORK_IDS.mainnet;

export const getAddressParameters = (account: { index: number }, path: string) => ({
    path,
    addressType: getAddressType(),
    stakingPath: getStakingPath(account),
});
