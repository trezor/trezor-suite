import { useSelector } from 'react-redux';

import { type TokenAddress, type TokenSymbol, toTokenSymbol } from '@suite-common/tokens';
import {
    type AccountsRootState,
    getAccountCryptoBalanceWithStaking,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { findToken, isAccountFailed } from '@suite-common/wallet-utils';
import { Badge } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    CryptoToFiatAmountFormatter,
    TokenToFiatAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';

import { type NativeAccountsRootState, selectAccountHasAnyKnownTokens } from '../../selectors';
import { type OnSelectAccount } from '../../types';
import { AccountLabel } from '../AccountLabel';
import { AccountsListItemBase } from './AccountsListItemBase';

type AssetAccountListItemProps = {
    account: Account;
    contractAddress?: TokenAddress;
    tokenSymbol?: TokenSymbol;
    onPress: OnSelectAccount;
};

/**
 * One account's holding of a single asset, for screens where the asset is already chosen
 * (asset detail, sending or receiving a token). Unlike `AccountsListItem`, which sums up the
 * whole account, it shows only that asset: a coin together with its staked amount, and a token
 * the account doesn't hold as 0.
 */
export const AssetAccountListItem = ({
    account,
    contractAddress,
    tokenSymbol,
    onPress,
}: AssetAccountListItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const hasAnyKnownTokens = useSelector((state: NativeAccountsRootState) =>
        selectAccountHasAnyKnownTokens(state, account.key),
    );
    const token = findToken(account.tokens, contractAddress);
    const cryptoBalance = contractAddress
        ? (token?.balance ?? '0')
        : getAccountCryptoBalanceWithStaking(account);
    const isFailed = isAccountFailed(account);

    const fiatValue = contractAddress ? (
        <TokenToFiatAmountFormatter
            symbol={account.symbol}
            contract={contractAddress}
            value={cryptoBalance}
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    ) : (
        <CryptoToFiatAmountFormatter
            value={cryptoBalance}
            symbol={account.symbol}
            isBalance
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );

    const cryptoValue = contractAddress ? (
        <CompactTokenAmountFormatter
            value={asDecimalTokenAmount(cryptoBalance)}
            networkSymbol={symbol}
            contractAddress={contractAddress}
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    ) : (
        <CompactCryptoAmountFormatter
            value={cryptoBalance}
            symbol={account.symbol}
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );

    return (
        <AccountsListItemBase
            icon={<TokenIcon tokenSymbol={account.symbol} networkSymbol={account.symbol} />}
            title={<AccountLabel account={account} />}
            titleBadge={
                formattedAccountType ? (
                    <Badge label={formattedAccountType} size="small" />
                ) : undefined
            }
            mainValue={
                isFailed ? <Icon name="warning" color="contentWarning" size="medium" /> : fiatValue
            }
            secondaryValue={isFailed ? undefined : cryptoValue}
            onPress={() => onPress({ account, tokenAddress: contractAddress, hasAnyKnownTokens })}
        />
    );
};
