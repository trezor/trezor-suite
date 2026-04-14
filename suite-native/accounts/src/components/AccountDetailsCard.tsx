import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Card, ErrorMessage, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountsListItem } from './AccountsList/AccountsListItem';
import { TokenReceiveCard } from './TokenReceiveCard';

type AccountDetailsCardProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    isStakeVariant?: boolean;
    titleLabel?: ReactNode;
    cryptoAmount?: string;
};

const stakeCardStyle = prepareNativeStyle<{ isStakeVariant: boolean }>(
    (utils, { isStakeVariant }) => ({
        extend: {
            condition: isStakeVariant,
            style: {
                backgroundColor: utils.colors.legacyBackgroundTertiaryDefaultOnElevation1,
                borderColor: utils.colors.legacyBackgroundTertiaryDefaultOnElevation0,
                borderWidth: utils.borders.widths.small,
                pointerEvents: 'none',
            },
        },
    }),
);

export const AccountDetailsCard = ({
    accountKey,
    tokenContract,
    isStakeVariant = false,
    titleLabel,
    cryptoAmount,
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

    return (
        <VStack spacing="sp16">
            <Card
                noPadding={!tokenContract}
                noShadow={isStakeVariant}
                style={applyStyle(stakeCardStyle, { isStakeVariant })}
            >
                {tokenContract ? (
                    <TokenReceiveCard contract={tokenContract} accountKey={accountKey} />
                ) : (
                    <AccountsListItem
                        account={account}
                        isNativeCoinOnly
                        isCryptoBalancePrimary={isStakeVariant}
                        titleLabel={titleLabel}
                        cryptoAmount={cryptoAmount}
                    />
                )}
            </Card>
        </VStack>
    );
};
