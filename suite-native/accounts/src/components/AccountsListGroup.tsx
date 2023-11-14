import { G } from '@mobily/ts-belt';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Account, AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AccountListItemInteractive } from './AccountListItemInteractive';

type AccountsListGroupProps = {
    accounts: readonly Account[] | null;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

const accountListGroupStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: 12,
    marginBottom: utils.spacings.small,
}));

export const AccountsListGroup = ({ accounts, onSelectAccount }: AccountsListGroupProps) => {
    const { applyStyle } = useNativeStyles();

    if (G.isNull(accounts)) return null;

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
