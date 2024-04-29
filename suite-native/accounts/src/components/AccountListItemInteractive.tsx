import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { AccountsRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { selectIsEthereumAccountWithTokensWithFiatRates } from '@suite-native/ethereum-tokens';
import { SettingsSliceRootState } from '@suite-native/settings';
import { Box } from '@suite-native/atoms';

import { TokenList } from './TokenList';
import { AccountListItem, AccountListItemProps } from './AccountListItem';

interface AccountListItemInteractiveProps extends AccountListItemProps {
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
}

export const AccountListItemInteractive = ({
    account,
    onSelectAccount,
}: AccountListItemInteractiveProps) => {
    const areTokensDisplayed = useSelector(
        (state: SettingsSliceRootState & FiatRatesRootState & AccountsRootState) =>
            selectIsEthereumAccountWithTokensWithFiatRates(state, account.key),
    );

    return (
        <Box>
            <TouchableOpacity onPress={() => onSelectAccount(account.key)}>
                <AccountListItem
                    key={account.key}
                    account={account}
                    areTokensDisplayed={areTokensDisplayed}
                />
            </TouchableOpacity>
            {areTokensDisplayed && (
                <TokenList accountKey={account.key} onSelectAccount={onSelectAccount} />
            )}
        </Box>
    );
};
