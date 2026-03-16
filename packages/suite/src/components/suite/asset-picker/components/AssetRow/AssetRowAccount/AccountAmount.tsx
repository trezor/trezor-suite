import { type Account } from '@suite-common/wallet-types';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

interface AccountAmountProps {
    account: Account;
}

export function AccountAmount({ account }: AccountAmountProps) {
    const accountBalance = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(account.balance)),
        symbol: account.symbol,
    });

    return (
        <Column alignItems="flex-end">
            <Text intent="neutral" typographyStyle="body-md">
                <FormattedCryptoAmount symbol={account.symbol} value={accountBalance} isBalance />
            </Text>
            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                <BaseCurrencyValue
                    symbol={account.symbol}
                    amount={accountBalance}
                    fiatAmountFormatterOptions={{
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }}
                />
            </Text>
        </Column>
    );
}
