import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountFiatBalance, isStakingSymbol } from '@suite-common/wallet-utils';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { AccountLabel } from '@suite-native/labeling';
import {
    type NativeStakingRootState,
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
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const cryptoBalanceWithStaking = useSelector((state: NativeStakingRootState) =>
        selectAccountCryptoBalanceWithStaking(state, account.key),
    );
    const shouldIncludeStaking = isStakingSymbol(account.symbol);

    const baseCurrencyBalance = useMemo(
        () => getAccountFiatBalance({ account, baseCurrencyCode, rates, shouldIncludeStaking }),
        [account, baseCurrencyCode, rates, shouldIncludeStaking],
    );

    return (
        <HStack alignItems="center" justifyContent="space-between" marginBottom="sp16">
            <Text variant="body-md-strong">
                <AccountLabel account={account} />
            </Text>

            {hasAnyKnownTokens && (
                <VStack spacing={0} alignItems="flex-end">
                    <BaseCurrencyAmountFormatter
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        value={baseCurrencyBalance}
                    />
                    <CryptoAmountFormatter
                        value={cryptoBalanceWithStaking}
                        symbol={account.symbol}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    />
                </VStack>
            )}
        </HStack>
    );
};
