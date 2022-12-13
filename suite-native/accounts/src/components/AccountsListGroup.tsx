import React from 'react';
import { useSelector } from 'react-redux';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AccountsRootState, selectAccountsByNetworkSymbols } from '@suite-common/wallet-core';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { AccountListItemInteractive } from './AccountListItemInteractive';

type AccountsListGroupProps = {
    symbol: NetworkSymbol;
    onSelectAccount: (accountKey: string) => void;
};

const accountListGroupStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray0,
    borderRadius: 12,
    marginBottom: utils.spacings.small,
}));

export const AccountsListGroup = ({ symbol, onSelectAccount }: AccountsListGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const accounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkSymbols(state, [symbol]),
    );

    return (
        <Box style={applyStyle(accountListGroupStyle)}>
            {accounts.map(account => (
                <AccountListItemInteractive
                    key={account.key}
                    account={account}
                    onSelectAccount={onSelectAccount}
                />
            ))}
        </Box>
    );
};
