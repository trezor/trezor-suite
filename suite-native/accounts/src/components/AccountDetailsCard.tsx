import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Card, ErrorMessage, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AccountsListItem } from './AccountsList/AccountsListItem';
import { TokenReceiveCard } from './TokenReceiveCard';

type AccountDetailsCardVariant = 'default' | 'stake';

type AccountDetailsCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    variant?: AccountDetailsCardVariant;
};

const stakeCardStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
}));

export const AccountDetailsCard = ({
    accountKey,
    tokenContract,
    variant = 'default',
}: AccountDetailsCardProps) => {
    const { translate } = useTranslate();
    const { applyStyle } = useNativeStyles();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (G.isNullable(account))
        return (
            <ErrorMessage
                errorMessage={translate('moduleAccounts.accountNotFound', { accountKey })}
            />
        );

    const isStakeVariant = variant === 'stake';

    return (
        <VStack spacing="sp16">
            <Card
                noPadding={!tokenContract}
                noShadow={isStakeVariant}
                borderColor={isStakeVariant ? 'backgroundTertiaryDefaultOnElevation0' : undefined}
                style={isStakeVariant ? applyStyle(stakeCardStyle) : undefined}
            >
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountsListItem
                        account={account}
                        isNativeCoinOnly
                        isCryptoBalancePrimary={isStakeVariant}
                    />
                )}
            </Card>
        </VStack>
    );
};
