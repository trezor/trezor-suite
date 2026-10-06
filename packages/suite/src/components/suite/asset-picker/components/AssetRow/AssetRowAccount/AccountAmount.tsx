import { type Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

interface AccountAmountProps {
    account: Account;
    isFiatPrimary?: boolean;
    isDisabled?: boolean;
}

export function AccountAmount({
    account,
    isFiatPrimary = false,
    isDisabled = false,
}: AccountAmountProps) {
    const accountBalance = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(account.balance)),
        symbol: account.symbol,
    });

    const cryptoAmount = (
        <Text
            intent="neutral"
            priority={isFiatPrimary ? 'secondary' : undefined}
            typographyStyle={isFiatPrimary ? 'body-sm' : 'body-md'}
            isDisabled={isDisabled}
        >
            <FormattedCryptoAmount symbol={account.symbol} value={accountBalance} isCompact />
        </Text>
    );

    const fiat = (
        <Text
            intent="neutral"
            priority={isFiatPrimary ? undefined : 'secondary'}
            typographyStyle={isFiatPrimary ? 'body-md' : 'body-sm'}
            isDisabled={isDisabled}
        >
            <BaseCurrencyValue
                symbol={account.symbol}
                amount={accountBalance}
                fiatAmountFormatterOptions={{
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }}
            />
        </Text>
    );

    return (
        <Column alignItems="flex-end">
            {isFiatPrimary ? fiat : cryptoAmount}
            {isFiatPrimary ? cryptoAmount : fiat}
        </Column>
    );
}
