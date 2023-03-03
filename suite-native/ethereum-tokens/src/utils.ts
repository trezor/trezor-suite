import { TokenInfo } from '@trezor/blockchain-link';

export const filterTokenHasBalance = (token: TokenInfo) => !!token.balance && token.balance !== '0';
