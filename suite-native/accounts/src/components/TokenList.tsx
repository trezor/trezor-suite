import React from 'react';
import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import {
    getEthereumTokenName,
    selectEthereumAccountsTokensWithFiatRates,
} from '@suite-native/ethereum-tokens';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { FiatRatesRootState } from '@suite-native/fiat-rates';
import { SettingsSliceRootState } from '@suite-native/module-settings';

import { TokenListItem } from './TokenListItem';

type TokenListProps = {
    accountKey: string;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

export const TokenList = ({ accountKey, onSelectAccount }: TokenListProps) => {
    const accountTokens = useSelector((state: FiatRatesRootState & SettingsSliceRootState) =>
        selectEthereumAccountsTokensWithFiatRates(state, accountKey),
    );

    if (A.isEmpty(accountTokens)) return null;

    return (
        <>
            {accountTokens.map((token, index) => (
                <TokenListItem
                    key={token.contract}
                    contract={token.contract}
                    accountKey={accountKey}
                    symbol={token.symbol}
                    onSelectAccount={onSelectAccount}
                    balance={token.balance}
                    label={getEthereumTokenName(token.name)}
                    isLast={accountTokens?.length - 1 === index}
                />
            ))}
        </>
    );
};
