import { Translation } from '@suite/intl';
import { selectAccountAssets } from '@suite-common/assets';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Card, Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from '#src/components/suite';
import { useSelector } from '#src/hooks/suite';
import { useAccountHeaderContext } from '#src/support/suite/AccountHeaderProvider';
import { HomeTotalBalance } from '#src/views/home/HomeBalance/HomeTotalBalance';

type AccountAssetBalanceProps = {
    accountKey: AccountKey;
};

/** What the account is worth in total, and how many assets make it up. */
export const AccountAssetBalance = ({ accountKey }: AccountAssetBalanceProps) => {
    const assets = useSelector(state => selectAccountAssets(state, accountKey));
    const { balanceSectionRef } = useAccountHeaderContext();
    const fiatValues = assets.flatMap(({ fiatValue }) => fiatValue ?? []);
    // No total while nothing can be priced: zero would say the account is empty.
    const fiatValue =
        fiatValues.length === 0
            ? undefined
            : fiatValues.reduce((total, value) => total.plus(value), new BigNumber(0));
    // Testnets are never priced, nor is anything before the rates load, so the coin, its stake
    // included, stands in for the total.
    const coinAsset = assets.find(({ kind }) => kind === 'coin');

    return (
        <Box flex="1" minWidth={280}>
            <Card height="100%" data-testid="@wallet/account-assets/balance">
                <Column gap={24} height="100%" justifyContent="space-between" alignItems="stretch">
                    <Row justifyContent="space-between" alignItems="center">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_ACCOUNT_ASSETS_BALANCE" />
                        </Text>
                        <Text
                            typographyStyle="body-sm"
                            intent="neutral"
                            priority="secondary"
                            data-testid="@wallet/account-assets/count"
                        >
                            <Translation
                                id="TR_ACCOUNT_ASSETS_COUNT"
                                values={{ count: assets.length }}
                            />
                        </Text>
                    </Row>
                    <Column ref={balanceSectionRef} alignItems="flex-start">
                        <HomeTotalBalance
                            fiatValue={fiatValue}
                            data-testid="@wallet/account-assets/fiat-amount"
                        />
                        {fiatValue === undefined && coinAsset !== undefined && (
                            <Text typographyStyle="headline-lg">
                                <FormattedCryptoAmount
                                    value={coinAsset.amount}
                                    symbol={coinAsset.symbol}
                                    data-testid="@wallet/account-assets/crypto-amount"
                                />
                            </Text>
                        )}
                    </Column>
                </Column>
            </Card>
        </Box>
    );
};
