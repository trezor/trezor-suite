import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountListItem } from '@suite-native/accounts';
import { ErrorMessage, VStack, Card } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { TokenReceiveCard } from './TokenReceiveCard';

type ReceiveAccountDetailsCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const ReceiveAccountDetailsCard = ({
    accountKey,
    tokenContract,
}: ReceiveAccountDetailsCardProps) => {
    const { translate } = useTranslate();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (G.isNullable(account))
        return (
            <ErrorMessage
                errorMessage={translate('moduleReceive.accountNotFound', { accountKey })}
            />
        );

    return (
        <VStack spacing="medium">
            <Card>
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountListItem account={account} />
                )}
            </Card>
        </VStack>
    );
};
