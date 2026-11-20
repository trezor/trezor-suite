import { type TokenAddress } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';

export type GlobalSendTarget = {
    account: Account;
    contractAddress?: TokenAddress;
};
