import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isErc4626 } from '@suite-common/wallet-utils';
import { BannerFull, Card, ErrorMessage, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

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

    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const isDefiToken = !!token && isErc4626(token);

    if (G.isNullable(account))
        return (
            <ErrorMessage
                errorMessage={translate('moduleAccounts.accountNotFound', { accountKey })}
            />
        );

    return (
        <VStack spacing="sp16">
            {isDefiToken && (
                <BannerFull
                    title={translate('moduleSend.defi.banner.title', { token: token?.symbol })}
                    description={translate('moduleSend.defi.banner.description')}
                    iconName="info"
                    intent="info"
                />
            )}

            <Card noPadding={!tokenContract}>
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountsListItem account={account} />
                )}
            </Card>
        </VStack>
    );
};
