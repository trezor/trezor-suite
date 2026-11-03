import { type ReactNode } from 'react';

import { type TokenInfoBranded } from '@suite-common/tokens';
import { type Account } from '@suite-common/wallet-types';
import {
    CompactTokenAmountFormatter,
    TokenToFiatAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon, TokenName } from '@suite-native/tokens';

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
    const balance = token.balance ?? '0';

    return (
        <AccountsListItemBase
            title={
                <TokenName
                    isInline
                    networkSymbol={account.symbol}
                    contractAddress={token.contract}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                />
            }
            hasBackground={hasBackground}
            isFirst={isFirst}
            isLast={isLast}
            onPress={onSelectAccount}
            icon={
                <TokenIcon
                    networkSymbol={account.symbol}
                    contractAddress={token.contract}
                    showNetworkIcon
                />
            }
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
                    networkSymbol={account.symbol}
                    contractAddress={token.contract}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    ellipsizeMode="tail"
                />
            }
        />
    );
};
