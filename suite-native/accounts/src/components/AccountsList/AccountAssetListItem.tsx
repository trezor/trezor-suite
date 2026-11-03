import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type AssetAccount,
    selectFormattedAccountType,
} from '@suite-common/wallet-core';
import { type Account, toTokenSymbol } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';
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
import { AccountListTokenBadge } from './AccountListTokenBadge';
import { AccountsListItemBase } from './AccountsListItemBase';

type AccountAssetListItemProps = {
    account: Account;
    assetAccount: AssetAccount;
    onPress: OnSelectAccount;
};

export const AccountAssetListItem = ({
    account,
    assetAccount,
    onPress,
}: AccountAssetListItemProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );
    const hasAnyKnownTokens = useSelector((state: NativeAccountsRootState) =>
        selectAccountHasAnyKnownTokens(state, account.key),
    );
    const { contractAddress, cryptoBalance, symbol, tokenInfo } = assetAccount;
    const tokenSymbol = tokenInfo?.symbol ? toTokenSymbol(tokenInfo.symbol) : null;
    const isFailed = isAccountFailed(account);

    const fiatValue = contractAddress ? (
        <TokenToFiatAmountFormatter
            symbol={symbol}
            contract={contractAddress}
            value={cryptoBalance}
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    ) : (
        <CryptoToFiatAmountFormatter
            value={cryptoBalance}
            symbol={symbol}
            isBalance
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );

    const cryptoValue = contractAddress ? (
        <CompactTokenAmountFormatter
            value={asDecimalTokenAmount(cryptoBalance)}
            tokenSymbol={tokenSymbol}
            tokenDecimals={tokenInfo?.decimals}
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    ) : (
        <CompactCryptoAmountFormatter
            value={cryptoBalance}
            symbol={symbol}
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
            badges={hasAnyKnownTokens && <AccountListTokenBadge accountKey={account.key} />}
            mainValue={
                isFailed ? <Icon name="warning" color="contentWarning" size="medium" /> : fiatValue
            }
            secondaryValue={isFailed ? undefined : cryptoValue}
            onPress={() => onPress({ account, hasAnyKnownTokens })}
        />
    );
};
