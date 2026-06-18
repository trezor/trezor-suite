import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { getTronPendingUnstakeBalance, getUnstakingPeriodInDays } from '@suite-common/wallet-utils';
import { Box, Card, Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';

interface TronUnstakingCardProps {
    account: Account;
}

export const TronUnstakingCard = ({ account }: TronUnstakingCardProps) => {
    const pendingAmount = getTronPendingUnstakeBalance(account);

    if (new BigNumber(pendingAmount).lte(0)) {
        return null;
    }

    return (
        <Card paddingType="none">
            <Box padding={{ vertical: 12, horizontal: 20 }}>
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm-strong">
                        <Translation
                            id="TR_EARN_TRON_UNSTAKING"
                            values={{ days: getUnstakingPeriodInDays(account.networkType) }}
                        />
                    </Text>
                    <Column gap={2} alignItems="flex-end">
                        <Text typographyStyle="body-md-strong">
                            <FormattedCryptoAmount value={pendingAmount} symbol={account.symbol} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <BaseCurrencyValue
                                amount={pendingAmount}
                                symbol={account.symbol}
                                showApproximationIndicator
                            />
                        </Text>
                    </Column>
                </Row>
            </Box>
        </Card>
    );
};
