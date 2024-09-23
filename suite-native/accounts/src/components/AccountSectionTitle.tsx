import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { HStack, VStack, Text } from '@suite-native/atoms';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { Account } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';

type AccountSectionTitleProps = {
    account: Account;
    hasAnyKnownTokens: boolean;
    fiatBalance?: string;
};

export const AccountSectionTitle: React.FC<AccountSectionTitleProps> = ({
    account,
    hasAnyKnownTokens,
}) => {
    const localCurrency = useSelector(selectFiatCurrencyCode);
    const rates = useSelector(selectCurrentFiatRates);

    const fiatBalance = useMemo(() => {
        return getAccountFiatBalance({ account, localCurrency, rates });
    }, [account, localCurrency, rates]);

    return (
        <HStack alignItems="center" justifyContent="space-between" marginBottom="medium">
            <Text variant="highlight">{account.accountLabel}</Text>

            {hasAnyKnownTokens && (
                <VStack spacing={0} alignItems="flex-end">
                    <FiatAmountFormatter
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        value={fiatBalance}
                    />
                </VStack>
            )}
        </HStack>
    );
};
