import { useSelector } from 'react-redux';

import { HStack, VStack } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { CryptoIcon } from '@suite-common/icons';
import {
    selectEthereumAccountTokenInfo,
    selectEthereumAccountTokenSymbol,
} from '@suite-native/ethereum-tokens';
import { AccountsRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

type AccountDetailTokenHeaderProps = {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
};

export const AccountDetailTokenHeader = ({
    accountKey,
    tokenContract,
}: AccountDetailTokenHeaderProps) => {
    const tokenAccount = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenInfo(state, accountKey, tokenContract),
    );

    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, tokenContract),
    );

    if (!tokenAccount || !tokenAccount.balance) return null;

    return (
        <VStack alignItems="center" spacing="small" marginVertical="medium">
            <HStack spacing="small" flexDirection="row" alignItems="center" justifyContent="center">
                <CryptoIcon symbol={tokenAccount.contract} size="extraSmall" />
                <EthereumTokenAmountFormatter value={tokenAccount?.balance} symbol={tokenSymbol} />
            </HStack>
            <EthereumTokenToFiatAmountFormatter
                variant="titleLarge"
                contract={tokenAccount.contract}
                value={tokenAccount?.balance}
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        </VStack>
    );
};
