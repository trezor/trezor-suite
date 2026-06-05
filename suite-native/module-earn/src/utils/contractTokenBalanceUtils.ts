import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const hasPositiveContractTokenBalance = (
    account: Account,
    tokenContract: TokenAddress | null,
): boolean => {
    if (!tokenContract) {
        return false;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    return (
        account.tokens?.some(token => {
            const normalizedAccountTokenContract = getContractAddressForNetworkSymbol(
                account.symbol,
                token.contract,
            );

            return (
                normalizedAccountTokenContract === normalizedContract &&
                new BigNumber(token.balance ?? '0').gt(0)
            );
        }) ?? false
    );
};
