import { useSelector } from 'react-redux';

import { HiddenPlaceholder } from '@suite/discreet-mode';
import {
    type StakingRootState,
    selectStakingAccountAmountOutsideBalance,
} from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, getAccountFiatBalance } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

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

    const stakingBalance = useSelector((state: StakingRootState) =>
        selectStakingAccountAmountOutsideBalance(state, account.key),
    );

    const fiatAmount = getAccountFiatBalance({
        account,
        baseCurrencyCode,
        rates,
        shouldIncludeTokens: true,
        stakingBalance,
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
