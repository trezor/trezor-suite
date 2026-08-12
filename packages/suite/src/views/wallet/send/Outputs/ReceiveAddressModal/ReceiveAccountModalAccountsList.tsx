import { type TrezorDevice } from '@suite-common/suite-types';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccountsByDeviceStateAndNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { CardList, CollapsibleBox, Column, Text } from '@trezor/components';
import { arrayPartition } from '@trezor/utils';

import { useSelector } from 'src/hooks/suite';

import { ReceiveAccountItem } from './ReceiveAccountItem';

interface ReceiveAccountModalAccountsListProps {
    wallet: TrezorDevice;
    symbol: NetworkSymbol;
    onAccountSelect: (account: Account) => void;
}

export const ReceiveAccountModalAccountsList = ({
    wallet,
    symbol,
    onAccountSelect,
}: ReceiveAccountModalAccountsListProps) => {
    const accounts = useSelector(state =>
        wallet.state
            ? selectAccountsByDeviceStateAndNetworkSymbol(state, wallet.state, symbol)
            : [],
    );

    if (accounts.length === 0) {
        return (
            <Column alignItems="center" gap={4} padding={{ vertical: 16 }}>
                <Text typographyStyle="body-md">Accounts not found</Text>
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    No accounts have been found for this wallet.
                </Text>
            </Column>
        );
    }

    const [emptyAccounts, nonEmptyAccounts] = arrayPartition(
        accounts,
        account => account.balance === '0',
    );

    return (
        <Column gap={12}>
            <CardList>
                {nonEmptyAccounts.map(account => (
                    <ReceiveAccountItem
                        key={account.key}
                        account={account}
                        onAccountSelect={onAccountSelect}
                    />
                ))}
            </CardList>

            {emptyAccounts.length > 0 && (
                <CollapsibleBox heading="Zero-balance accounts">
                    <CardList>
                        {emptyAccounts.map(account => (
                            <ReceiveAccountItem
                                key={account.key}
                                account={account}
                                onAccountSelect={onAccountSelect}
                            />
                        ))}
                    </CardList>
                </CollapsibleBox>
            )}
        </Column>
    );
};
