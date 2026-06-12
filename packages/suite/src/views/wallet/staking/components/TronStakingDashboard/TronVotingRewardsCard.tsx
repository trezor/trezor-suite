import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { getTronStakingRewards } from '@suite-common/wallet-utils';
import { Box, Button, Card, Column, Row, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

interface TronVotingRewardsCardProps {
    account: Account;
}

export const TronVotingRewardsCard = ({ account }: TronVotingRewardsCardProps) => {
    const dispatch = useDispatch();
    const rewards = getTronStakingRewards(account);

    if (new BigNumber(rewards).lte(0)) {
        return null;
    }

    const goToClaim = () =>
        dispatch(
            goto({
                routeName: 'earn-tron-claim',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Card paddingType="none">
            <Box padding={{ vertical: 12, horizontal: 20 }}>
                <Row justifyContent="space-between" alignItems="center">
                    <Text typographyStyle="body-sm-strong">
                        <Translation id="TR_EARN_TRON_VOTING_REWARDS" />
                    </Text>
                    <Row gap={16} alignItems="center">
                        <Column gap={2} alignItems="flex-end">
                            <Text typographyStyle="body-md-strong">
                                <FormattedCryptoAmount value={rewards} symbol={account.symbol} />
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <BaseCurrencyValue
                                    amount={rewards}
                                    symbol={account.symbol}
                                    showApproximationIndicator
                                />
                            </Text>
                        </Column>
                        <Button intent="neutral" priority="secondary" onClick={goToClaim}>
                            <Translation id="TR_STAKE_CLAIM" />
                        </Button>
                    </Row>
                </Row>
            </Box>
        </Card>
    );
};
