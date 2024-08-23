import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { AccountsRootState, FiatRatesRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { SettingsSliceRootState } from '@suite-native/settings';
import {
    getEthereumTokenName,
    selectEthereumAccountsTokensWithFiatRates,
} from '@suite-native/tokens';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';

import { TokenListItem } from './TokenListItem';
import { OnSelectAccount } from '../types';

type TokenListProps = {
    account: Account;
    onSelectAccount: OnSelectAccount;
};

const titleContainerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
    paddingTop: 12,
}));

export const TokenList = ({ account, onSelectAccount }: TokenListProps) => {
    const { applyStyle } = useNativeStyles();
    const accountTokens = useSelector(
        (state: FiatRatesRootState & SettingsSliceRootState & AccountsRootState) =>
            selectEthereumAccountsTokensWithFiatRates(state, account.key),
    );

    if (A.isEmpty(accountTokens)) return null;

    return (
        <>
            <Box style={applyStyle(titleContainerStyle)}>
                <Text variant="callout" color="textSubdued">
                    <Translation id="accountList.tokens" />
                </Text>
            </Box>
            {accountTokens.map(token => (
                <TokenListItem
                    key={token.contract}
                    contract={token.contract}
                    accountKey={account.key}
                    onSelectAccount={() =>
                        onSelectAccount({
                            account,
                            tokenAddress: token.contract,
                            hasAnyTokensWithFiatRates: true,
                        })
                    }
                    balance={token.balance}
                    label={getEthereumTokenName(token.name)}
                />
            ))}
        </>
    );
};
