import { type Account, type RatesByKey } from '@suite-common/wallet-types';
import { getAccountFiatBalance, isStakingSymbol } from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

type GetPortfolioGraphTotalFiatBalanceParams = {
    deviceAccounts: Account[];
    fiatRates: RatesByKey | undefined;
    baseCurrencyCode: BaseCurrencyCode;
};

export const getPortfolioGraphTotalFiatBalance = ({
    deviceAccounts,
    fiatRates,
    baseCurrencyCode,
}: GetPortfolioGraphTotalFiatBalanceParams) => {
    let totalFiatBalance = new BigNumber(0);

    // Preserve native portfolio semantics: staking is included per account only when mobile
    // supports staking for that network symbol. The shared total helper exposes staking as
    // a single global option, so it cannot express this condition.
    deviceAccounts.forEach(account => {
        const accountFiatBalance =
            getAccountFiatBalance({
                account,
                baseCurrencyCode,
                rates: fiatRates,
                shouldIncludeStaking: isStakingSymbol(account.symbol),
            }) ?? '0';

        totalFiatBalance = totalFiatBalance.plus(accountFiatBalance);
    });

    return totalFiatBalance;
};
