import React, { useMemo } from 'react';
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
    const symbols = useMemo(() => [symbol], [symbol]);
    const accounts = useSelector((state: AccountsRootState) =>
        // we need to memoize [symbol] array to prevent re-renders with every state change
        selectAccountsByNetworkSymbols(state, symbols),
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
