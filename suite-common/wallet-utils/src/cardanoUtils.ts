import { Network } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { CARDANO, PROTO } from '@trezor/connect';

// NOTE: This was moved from packages/suite/src/utils/wallet/cardanoUtils.ts
// Reason for that is that we need to use it in @suite-common/ package, but we cannot import
// @fivebinaries/coin-selection there, because it will break mobile app bundling.
export const getDerivationType = (accountType: Network['accountType']) => {
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

export const getStakingPath = (account: Account) => `m/1852'/1815'/${account.index}'/2/0`;

export const getProtocolMagic = (accountSymbol: Account['symbol']) =>
    // TODO: use testnet magic from connect once this PR is merged https://github.com/trezor/connect/pull/1046
    accountSymbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getAddressType = (_accountType: Account['accountType']) =>
    PROTO.CardanoAddressType.BASE;

export const getNetworkId = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.NETWORK_IDS.mainnet : CARDANO.NETWORK_IDS.testnet;
