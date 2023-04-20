import { NetworkSymbol } from '@suite-common/wallet-config';
import { ethereumTokenIcons, EthereumTokenIconName } from '@trezor/icons';

import { EthereumTokenSymbol, WalletAccountTransaction } from './types';

export const isEthereumAccountSymbol = (symbol: NetworkSymbol) => symbol === 'eth';

export const getEthereumTokenIconName = (symbol: EthereumTokenSymbol) => {
    const lowerCaseSymbol = symbol.toLowerCase();
    return (
        lowerCaseSymbol in ethereumTokenIcons ? lowerCaseSymbol : 'erc20'
    ) as EthereumTokenIconName;
};

export const getTransactionTokensCount = (transaction: WalletAccountTransaction) => {
    if (transaction.tokens) {
        return transaction.tokens.length;
    }
    return 0;
};
