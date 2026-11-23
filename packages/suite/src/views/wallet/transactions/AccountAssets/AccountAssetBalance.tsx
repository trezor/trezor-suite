import { TotalBalanceCard, TotalBalanceHeadline } from '@suite/assets';
import { Translation } from '@suite/intl';
import { selectAccountAssetOverview, selectAccountFiatBalance } from '@suite-common/assets';
import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isUtxoBased } from '@suite-common/wallet-utils';
import { Box, Column, Text } from '@trezor/components';

import { AmountUnitSwitchWrapper } from '#src/components/suite/AmountUnitSwitchWrapper';
import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useSelector } from '#src/hooks/suite/useSelector';

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
                    {account && isUtxoBased(account) && (
                        <Text
                            as="div"
                            typographyStyle="body-md"
                            intent="neutral"
                            priority="secondary"
                            data-testid="@wallet/account-assets/crypto-amount"
                        >
                            <AmountUnitSwitchWrapper symbol={account.symbol}>
                                <FormattedCryptoAmount
                                    value={account.formattedBalance}
                                    networkSymbol={account.symbol}
                                />
                            </AmountUnitSwitchWrapper>
                        </Text>
                    )}
                </Column>
            </TotalBalanceCard>
        </Box>
    );
};
