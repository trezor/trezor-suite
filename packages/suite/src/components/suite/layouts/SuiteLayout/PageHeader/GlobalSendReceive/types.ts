import { type Account, type TokenAddress } from '@suite-common/wallet-types';

export type GlobalSendTarget = {
    account: Account;
    contractAddress?: TokenAddress;
};
