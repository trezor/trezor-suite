import {
    selectAccountHasStaking,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { areTokenFiatRatesLoading, getAccountFiatBalance } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { Row } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

import { AccountItem } from './AccountItem/AccountItem';

type AccountSectionProps = {
    account: Account;
    tokens: TokenInfo[];
    selected: boolean;
};

export const AccountSection = ({ account, tokens, selected }: AccountSectionProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const hasStaking = useSelector(state => selectAccountHasStaking(state, account.key));
    const accountWithVisibleTokens = { ...account, tokens };
    const fiatBalance = getAccountFiatBalance({
        account: accountWithVisibleTokens,
        shouldIncludeStaking: hasStaking,
        baseCurrencyCode,
        rates,
    });

    return (
        <Row>
            <AccountItem
                account={account}
                isSelected={selected}
                customFiatValue={fiatBalance ?? undefined}
                tokenCount={tokens.length}
                hasStaking={hasStaking}
                dataTestKey={`@account-menu/${account.symbol}/${account.accountType}/${account.index}`}
                isFiatLoading={areTokenFiatRatesLoading(
                    accountWithVisibleTokens,
                    baseCurrencyCode,
                    rates ?? {},
                )}
            />
        </Row>
    );
};
