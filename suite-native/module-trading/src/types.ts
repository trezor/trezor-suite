import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { Address } from '@trezor/blockchain-link-types';

// NOTE: in production code we probably want to use `TokenInfoBranded` or something similar instead
export type TradeableAsset = {
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    name?: string;
};

export type Country = { label: string; value: string };

export type ReceiveAccount = {
    account: Account;
    address?: Address;
};
