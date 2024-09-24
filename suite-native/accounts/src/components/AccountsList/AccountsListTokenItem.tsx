import { useSelector } from 'react-redux';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account, TokenInfoBranded } from '@suite-common/wallet-types';
import { RoundedIcon } from '@suite-native/atoms';
import {
    EthereumTokenAmountFormatter,
    EthereumTokenToFiatAmountFormatter,
} from '@suite-native/formatters';
import { getEthereumTokenName, selectEthereumAccountTokenSymbol } from '@suite-native/tokens';

import { AccountsListItemBase } from './AccountsListItemBase';

type AccountListTokenItemProps = {
    token: TokenInfoBranded;
    account: Account;
    onSelectAccount: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const AccountsListTokenItem = ({
    token,
    account,
    onSelectAccount,
    hasBackground,
    isFirst,
    isLast,
}: AccountListTokenItemProps) => {
    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, account.key, token.contract),
    );
    const balance = token.balance ?? '0';

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            onPress={onSelectAccount}
            icon={<RoundedIcon name={token.contract} />}
            title={getEthereumTokenName(token.name)}
            mainValue={
                <EthereumTokenToFiatAmountFormatter value={balance} contract={token.contract} />
            }
            secondaryValue={
                <EthereumTokenAmountFormatter
                    value={balance}
                    symbol={tokenSymbol}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                />
            }
        />
    );
};
