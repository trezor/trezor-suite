import { useSelector } from 'react-redux';

import { AccountsRootState } from '@suite-common/wallet-core';
import { Account, TokenInfoBranded } from '@suite-common/wallet-types';
import { RoundedIcon } from '@suite-native/atoms';
import { TokenAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';
import { getTokenName, selectAccountTokenSymbol } from '@suite-native/tokens';

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
        selectAccountTokenSymbol(state, account.key, token.contract),
    );
    const balance = token.balance ?? '0';

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            onPress={onSelectAccount}
            icon={<RoundedIcon name={token.contract} />}
            title={getTokenName(token.name)}
            mainValue={
                <TokenToFiatAmountFormatter
                    networkSymbol={account.symbol}
                    value={balance}
                    contract={token.contract}
                />
            }
            secondaryValue={
                <TokenAmountFormatter
                    value={balance}
                    symbol={tokenSymbol}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                />
            }
        />
    );
};
