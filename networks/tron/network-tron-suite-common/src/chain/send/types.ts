import type { ResponseTypes, TronAccountExtraData } from '@trezor/blockchain-link-types';
import type { ChainSendAccount } from '@trezor/network-module-suite-common-types';

export type EstimateFeeLevel = ResponseTypes.EstimateFee['payload'][number];

/** What composing reads of a Tron account's own data. */
export type TronSendAccountMisc = {
    tronResources?: Pick<
        TronAccountExtraData,
        'availableStakedBandwidth' | 'availableFreeBandwidth'
    >;
};

/** The family data of an account this network already checked to be its own. */
export const readTronSendAccountMisc = (account: ChainSendAccount) =>
    account.misc as TronSendAccountMisc | undefined;

export type TronSendConfig = {
    decimals: number;

    /** The coin symbol shown to the user, for error messages. */
    displaySymbol: string;
};
