import { useIntl } from 'react-intl';

import { Translation } from '@suite/intl';
import { Card, Column, H3, IconCircle, Note, Row, Table, Text, Tooltip } from '@trezor/components';
import { GiftIcon } from '@trezor/icons';

import { ReferralVoucherRow } from './ReferralVoucherRow';
import { type ReferralVoucher } from './mockReferralProgram';
import { getReferralRewardsSummary } from './referralRewardsUtils';

type ReferralRewardsProps = {
    vouchers: ReferralVoucher[];
    rewardAmount: number;
    fiatCurrency: string;
    annualRewardLimit: number;
    annualReferralLimit: number;
    rewardWaitingPeriodDays: number;
};

export const ReferralRewards = ({
    vouchers,
    rewardAmount,
    fiatCurrency,
    annualRewardLimit,
    annualReferralLimit,
    rewardWaitingPeriodDays,
}: ReferralRewardsProps) => {
    const { formatNumber } = useIntl();
    const summary = getReferralRewardsSummary(vouchers, rewardAmount);
    const formatAmount = (amount: number) =>
        formatNumber(amount, {
            style: 'currency',
            currency: fiatCurrency,
            maximumFractionDigits: 0,
        });

    return (
        <Card paddingType="none" data-testid="@referral/rewards">
            <Column padding={{ vertical: 16, horizontal: 20 }} gap={20}>
                <Row justifyContent="space-between" gap={12} flexWrap="wrap">
                    <H3 typographyStyle="body-md-strong">
                        <Translation id="TR_REFERRAL_YOUR_REWARDS" />
                    </H3>
                    <Tooltip
                        content={
                            <Translation
                                id="TR_REFERRAL_REWARDS_CONDITIONS"
                                values={{ rewardWaitingPeriodDays }}
                            />
                        }
                        placement="bottom"
                        tooltipMaxWidth={270}
                    >
                        <Note>
                            <Translation id="TR_REFERRAL_CONDITIONS" />
                        </Note>
                    </Tooltip>
                </Row>
                <Card type="flat" paddingType="none">
                    <Row
                        hasDivider
                        gap={32}
                        alignItems="stretch"
                        padding={{ vertical: 8, horizontal: 16 }}
                    >
                        <Column flex="1" minWidth={0}>
                            <Text
                                typographyStyle="headline-sm"
                                data-testid="@referral/total-earned"
                            >
                                {formatAmount(summary.totalEarned)}{' '}
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    / {formatAmount(annualRewardLimit)}
                                </Text>
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_REFERRAL_TOTAL_EARNED" />
                            </Text>
                        </Column>
                        <Column flex="1" minWidth={0}>
                            <Text
                                typographyStyle="headline-sm"
                                data-testid="@referral/voucher-count"
                            >
                                {summary.readyVoucherCount}
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_REFERRAL_VOUCHERS" />
                            </Text>
                        </Column>
                        <Column flex="1" minWidth={0}>
                            <Text
                                typographyStyle="headline-sm"
                                data-testid="@referral/referral-count"
                            >
                                {summary.referralCount}{' '}
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    / {annualReferralLimit}
                                </Text>
                            </Text>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <Translation id="TR_REFERRAL_REFERRALS" />
                            </Text>
                        </Column>
                    </Row>
                </Card>
            </Column>
            {vouchers.length === 0 ? (
                <Column
                    alignItems="center"
                    padding={{ vertical: 40, horizontal: 20 }}
                    data-testid="@referral/no-rewards"
                >
                    <IconCircle icon={GiftIcon} size={40} intent="brand" margin={{ bottom: 8 }} />
                    <Text typographyStyle="headline-sm">
                        <Translation id="TR_REFERRAL_NO_REWARDS" />
                    </Text>
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_REFERRAL_REWARDS_WILL_APPEAR" />
                    </Text>
                </Column>
            ) : (
                <Table>
                    <Table.Body>
                        {vouchers.map(voucher => (
                            <ReferralVoucherRow
                                key={voucher.id}
                                voucher={voucher}
                                rewardAmount={formatAmount(rewardAmount)}
                            />
                        ))}
                    </Table.Body>
                </Table>
            )}
        </Card>
    );
};
