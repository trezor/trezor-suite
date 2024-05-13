import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    getEthereumTokenName,
    selectEthereumAccountsTokensWithFiatRates,
} from '@suite-native/ethereum-tokens';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { SettingsSliceRootState } from '@suite-native/settings';
import { AccountsRootState, FiatRatesRootState } from '@suite-common/wallet-core';

import { TokenListItem } from './TokenListItem';

type TokenListProps = {
    accountKey: string;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

export const TokenList = ({ accountKey, onSelectAccount }: TokenListProps) => {
    const accountTokens = useSelector(
        (state: FiatRatesRootState & SettingsSliceRootState & AccountsRootState) =>
            selectEthereumAccountsTokensWithFiatRates(state, accountKey),
    );

    if (A.isEmpty(accountTokens)) return null;

    return (
        <>
            {accountTokens.map(token => (
                <TokenListItem
                    key={token.contract}
                    contract={token.contract}
                    accountKey={accountKey}
                    onSelectAccount={onSelectAccount}
                    balance={token.balance}
                    label={getEthereumTokenName(token.name)}
                />
            ))}
        </>
    );
};
