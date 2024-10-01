import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, FiatAmountFormatter } from '@suite-native/formatters';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import {
    NativeStakingRootState,
    selectAccountCryptoBalanceWithStaking,
} from '@suite-native/staking';

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
    const cryptoBalanceWithStaking = useSelector((state: NativeStakingRootState) =>
        selectAccountCryptoBalanceWithStaking(state, account.key),
    );

    const fiatBalance = useMemo(() => {
        return getAccountFiatBalance({ account, localCurrency, rates });
    }, [account, localCurrency, rates]);

    return (
        <HStack alignItems="center" justifyContent="space-between" marginBottom="sp16">
            <Text variant="highlight">{account.accountLabel}</Text>

            {hasAnyKnownTokens && (
                <VStack spacing={0} alignItems="flex-end">
                    <FiatAmountFormatter
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        value={fiatBalance}
                    />
                    <CryptoAmountFormatter
                        value={cryptoBalanceWithStaking}
                        network={account.symbol}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                </VStack>
            )}
        </HStack>
    );
};
