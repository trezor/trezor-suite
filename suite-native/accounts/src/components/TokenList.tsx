import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { AccountsRootState } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Box, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getEthereumTokenName, selectEthereumAccountsKnownTokens } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnSelectAccount } from '../types';
import { TokenListItem } from './TokenListItem';

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
    const accountTokens = useSelector((state: AccountsRootState & TokenDefinitionsRootState) =>
        selectEthereumAccountsKnownTokens(state, account.key),
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
                            hasAnyKnownTokens: true,
                        })
                    }
                    balance={token.balance}
                    label={getEthereumTokenName(token.name)}
                />
            ))}
        </>
    );
};
