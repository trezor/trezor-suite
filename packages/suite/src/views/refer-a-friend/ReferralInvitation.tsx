import { Translation } from '@suite/intl';
import { Button, Card, Column, H3, Link, Paragraph, Row } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { ReferralCard } from './ReferralCard';

type ReferralInvitationProps = {
    rewardAmount: string;
    minimumOrderAmount: string;
    friendDiscountPercentage: number;
    onJoin: () => void;
};

export const ReferralInvitation = ({
    rewardAmount,
    minimumOrderAmount,
    friendDiscountPercentage,
    onJoin,
}: ReferralInvitationProps) => {
    const isBelowTablet = useIsContentBelowBreakpoint(breakpoints.tablet);

    return (
        <Column gap={12}>
            <Card paddingType="none">
                <Row gap={24} alignItems="stretch" padding={20}>
                    <ReferralCard
                        rewardAmount={rewardAmount}
                        minimumOrderAmount={minimumOrderAmount}
                        friendDiscountPercentage={friendDiscountPercentage}
                    />
                    <Column
                        flex="1 1 280px"
                        minWidth={0}
                        gap={24}
                        justifyContent="space-between"
                        alignItems="flex-end"
                    >
                        <Column gap={0} alignItems="flex-end">
                            <H3
                                typographyStyle={isBelowTablet ? 'body-md' : 'headline-sm'}
                                align="end"
                                textWrap="balance"
                            >
                                <Translation id="TR_REFERRAL_INVITATION_TITLE" />
                            </H3>
                            {!isBelowTablet && (
                                <Paragraph
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id="TR_REFERRAL_INVITATION_DESCRIPTION"
                                        values={{ rewardAmount }}
                                    />
                                </Paragraph>
                            )}
                        </Column>
                        <Button
                            data-testid="@referral/join"
                            size={isBelowTablet ? 'small' : 'large'}
                            onClick={onJoin}
                        >
                            <Translation id="TR_REFERRAL_JOIN_PROGRAM" />
                        </Button>
                    </Column>
                </Row>
            </Card>
            <Paragraph
                typographyStyle="body-xs"
                intent="neutral"
                priority="secondary"
                align="center"
            >
                <Translation
                    id="TR_REFERRAL_TERMS"
                    values={{
                        privacyPolicy: chunks => (
                            <Link href="https://data.trezor.io/legal/privacy-policy.html">
                                {chunks}
                            </Link>
                        ),
                        programTerms: chunks => (
                            <Link href="https://trezor.io/terms-of-use#refer-a-friend">
                                {chunks}
                            </Link>
                        ),
                        generalTerms: chunks => (
                            <Link href="https://trezor.io/terms-of-use">{chunks}</Link>
                        ),
                    }}
                />
            </Paragraph>
        </Column>
    );
};
