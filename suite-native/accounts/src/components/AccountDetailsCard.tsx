import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Card, ErrorMessage, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { AccountsListItem } from './AccountsList/AccountsListItem';
import { TokenReceiveCard } from './TokenReceiveCard';

type AccountDetailsCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const AccountDetailsCard = ({ accountKey, tokenContract }: AccountDetailsCardProps) => {
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (G.isNullable(account))
        return (
            <ErrorMessage
                errorMessage={translate('moduleAccounts.accountNotFound', { accountKey })}
            />
        );

    return (
        <VStack spacing="sp16">
            <Card noPadding={!tokenContract}>
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountsListItem account={account} isNativeCoinOnly />
                )}
            </Card>
        </VStack>
    );
};
