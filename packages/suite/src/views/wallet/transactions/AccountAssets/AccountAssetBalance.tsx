import { TotalBalanceCard, TotalBalanceHeadline } from '@suite/assets';
import { Translation } from '@suite/intl';
import { selectAccountAssetOverview, selectAccountFiatBalance } from '@suite-common/assets';
import { selectIsStakingAccountActive } from '@suite-common/earn-staking';
import { selectAccountByKey, selectAccountTokens } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Column } from '@trezor/components';

import { useSelector } from '#src/hooks/suite/useSelector';
import { isAccountBalanceOnlyCoin } from '#src/utils/wallet/accountUtils';
import { SecondaryCryptoAmount } from '#src/views/wallet/transactions/components/SecondaryCryptoAmount';

type AccountAssetBalanceProps = {
    accountKey: AccountKey;
};

/** What the account is worth in total, and how many assets make it up. */
export const AccountAssetBalance = ({ accountKey }: AccountAssetBalanceProps) => {
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const shownTokenCount = useSelector(
        state => selectAccountTokens(state, accountKey)?.shownWithBalance.length ?? 0,
    );
    const hasStaking = useSelector(state => selectIsStakingAccountActive(state, accountKey));
    const isCryptoBalanceShown =
        account !== null && isAccountBalanceOnlyCoin({ shownTokenCount, hasStaking });
    const assetCount = useSelector(
        state => selectAccountAssetOverview(state, accountKey).assetCount,
    );
    const fiatValue = useSelector(state => selectAccountFiatBalance(state, accountKey));

    return (
        <Box flex="1" minWidth={280}>
            <TotalBalanceCard
                label={<Translation id="TR_ACCOUNT_ASSETS_BALANCE" />}
                labelAside={
                    <span data-testid="@wallet/account-assets/count">
                        <Translation id="TR_ACCOUNT_ASSETS_COUNT" values={{ count: assetCount }} />
                    </span>
                }
                isStretched
                data-testid="@wallet/account-assets/balance"
            >
                <Column alignItems="flex-start">
                    <TotalBalanceHeadline
                        fiatValue={fiatValue}
                        data-testid="@wallet/account-assets/fiat-amount"
                    />
                    {isCryptoBalanceShown && (
                        <SecondaryCryptoAmount
                            symbol={account.symbol}
                            value={account.formattedBalance}
                            data-testid="@wallet/account-assets/crypto-amount"
                        />
                    )}
                </Column>
            </TotalBalanceCard>
        </Box>
    );
};
