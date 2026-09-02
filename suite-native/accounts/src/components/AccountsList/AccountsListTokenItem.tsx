import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type Account, type TokenInfoBranded } from '@suite-common/wallet-types';
import {
    CompactTokenAmountFormatter,
    TokenToFiatAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { type TokensRootState, getTokenName, selectAccountTokenSymbol } from '@suite-native/tokens';

import { AccountsListItemBase } from './AccountsListItemBase';

type AccountListTokenItemProps = {
    token: TokenInfoBranded;
    account: Account;
    onSelectAccount: () => void;

    badges?: ReactNode;
    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    showFiatValue?: boolean;
};

export const AccountsListTokenItem = ({
    token,
    account,
    onSelectAccount,
    badges,
    hasBackground,
    isFirst,
    isLast,
    showFiatValue = true,
}: AccountListTokenItemProps) => {
    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, account.key, token.contract),
    );
    const balance = token.balance ?? '0';

    return (
        <AccountsListItemBase
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            onPress={onSelectAccount}
            icon={
                <TokenIcon
                    symbol={account.symbol}
                    contractAddress={token.contract}
                    showNetworkIcon
                />
            }
            title={getTokenName(token.name)}
            badges={badges}
            mainValue={
                showFiatValue && (
                    <TokenToFiatAmountFormatter
                        symbol={account.symbol}
                        value={balance}
                        contract={token.contract}
                    />
                )
            }
            secondaryValue={
                <CompactTokenAmountFormatter
                    value={asDecimalTokenAmount(balance)}
                    tokenSymbol={tokenSymbol}
                    tokenDecimals={token.decimals}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    ellipsizeMode="tail"
                />
            }
        />
    );
};
