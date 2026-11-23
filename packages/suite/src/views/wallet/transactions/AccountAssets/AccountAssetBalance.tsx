import { TotalBalanceCard, TotalBalanceHeadline } from '@suite/assets';
import { Translation } from '@suite/intl';
import { selectAccountAssetOverview, selectAccountFiatBalance } from '@suite-common/assets';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Column } from '@trezor/components';

import { SecondaryCryptoAmount } from '#src/components/wallet/SecondaryCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';
import { useAccountHeaderContext } from '#src/support/suite/AccountHeaderProvider';

type AccountAssetBalanceProps = {
    accountKey: AccountKey;
};

/** What the account is worth in total, and how many assets make it up. */
export const AccountAssetBalance = ({ accountKey }: AccountAssetBalanceProps) => {
    const account = useSelector(state => selectAccountByKey(state, accountKey));
    const assetCount = useSelector(
        state => selectAccountAssetOverview(state, accountKey).assetCount,
    );
    const fiatValue = useSelector(state => selectAccountFiatBalance(state, accountKey));
    const { balanceSectionRef } = useAccountHeaderContext();

    return (
        <Box ref={balanceSectionRef} flex="1" minWidth={280}>
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
                    {account && isUtxoBased(account) && (
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
