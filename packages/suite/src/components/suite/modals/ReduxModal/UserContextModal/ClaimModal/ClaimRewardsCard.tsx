import { useEffect } from 'react';

import { Account } from '@suite-common/wallet-types';
import { getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { Banner, Card, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { Translation } from 'src/components/suite/Translation';
import { useCardanoStaking } from 'src/hooks/wallet/useCardanoStaking';
import { Column } from 'src/views/wallet/staking/components/CardanoPrimitives';

type ClaimRewardsCardProps = {
    account: Account;
};

export const ClaimRewardsCard = ({ account }: ClaimRewardsCardProps) => {
    const { symbol } = account;
    const { restakedReward = '0' } = getStakingDataForNetwork(account) ?? {};
    const { calculateFeeAndDeposit, withdrawingAvailable, fee, rewards } = useCardanoStaking();

    useEffect(() => {
        calculateFeeAndDeposit('withdrawal');
    }, [calculateFeeAndDeposit]);

    const isWithdrawalBalanceInsufficient =
        !withdrawingAvailable.status && withdrawingAvailable.reason === 'UTXO_BALANCE_INSUFFICIENT';
    const isFeeGreaterThanRewards = new BigNumber(fee ?? '0').isGreaterThan(rewards ?? '0');
    const shouldShowWarning = isWithdrawalBalanceInsufficient || isFeeGreaterThanRewards;

    if (!restakedReward || restakedReward === '0') return null;

    return (
        <Card paddingType="small" flex="1">
            <Row justifyContent="space-between">
                <Column>
                    <Paragraph typographyStyle="body">
                        <Translation id="TR_STAKE_REWARDS" />
                    </Paragraph>
                </Column>
                <Column>
                    <Row gap={spacings.lg} justifyContent="flex-end">
                        <Paragraph typographyStyle="highlight">
                            <FormattedCryptoAmount value={restakedReward} symbol={symbol} />
                        </Paragraph>
                    </Row>
                    <Row gap={spacings.lg} justifyContent="flex-end">
                        <Paragraph variant="tertiary" typographyStyle="hint">
                            ≈
                            <BaseCurrencyValue amount={restakedReward} symbol={symbol} />
                        </Paragraph>
                    </Row>
                </Column>
            </Row>

            {shouldShowWarning && (
                <Banner
                    variant="warning"
                    icon="warning"
                    iconAlignment="start"
                    margin={{ top: spacings.md }}
                >
                    <Translation id="TR_STAKING_REWARDS_NETWORK_FEE_WARNING" />
                </Banner>
            )}
        </Card>
    );
};
