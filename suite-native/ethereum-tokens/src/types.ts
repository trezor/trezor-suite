import { TokenInfo } from '@trezor/blockchain-link';
import { EthereumTokenSymbol } from '@suite-common/wallet-types';

export type EthereumTokenAccountWithBalance = Omit<TokenInfo, 'balance'> & {
    balance: string;
    symbol: EthereumTokenSymbol;
};
