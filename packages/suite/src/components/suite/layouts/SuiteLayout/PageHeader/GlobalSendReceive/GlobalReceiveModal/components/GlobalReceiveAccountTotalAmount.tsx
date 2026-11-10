import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, getAccountFiatBalance } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { HiddenPlaceholder } from '#src/components/suite';

type GlobalReceiveAccountTotalAmountProps = {
    account: Account;
};

/** Everything the account holds, in fiat: the coin, its tokens and its stake. */
export const GlobalReceiveAccountTotalAmount = ({
    account,
}: GlobalReceiveAccountTotalAmountProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const fiatAmount = getAccountFiatBalance({
        account,
        baseCurrencyCode,
        rates,
        shouldIncludeTokens: true,
        shouldIncludeStaking: true,
    });

    return (
        <Text typographyStyle="body-md">
            <HiddenPlaceholder>
                <BaseCurrencyAmountFormatter
                    value={fiatAmount ?? BASE_CURRENCY_ZERO}
                    currency={baseCurrencyCode}
                />
            </HiddenPlaceholder>
        </Text>
    );
};
