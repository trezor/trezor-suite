import { TokenInfo } from '@trezor/blockchain-link';

export type EthereumTokenSymbol = string & { __type: 'EthereumTokenSymbol' };

export type EthereumTokenAccountWithBalance = Omit<TokenInfo, 'balance'> & {
    balance: string;
    symbol: EthereumTokenSymbol;
};
