import { Translation } from '@suite/intl';
import { Box, Button, Card, Column, Flex, H3, Link, Paragraph } from '@trezor/components';
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
    const isBelowMobile = useIsContentBelowBreakpoint(breakpoints.mobile);

    return (
        <Column gap={12}>
            <Card paddingType="none">
                <Flex
                    direction={isBelowMobile ? 'column' : 'row'}
                    gap={24}
                    alignItems={isBelowMobile ? 'center' : 'stretch'}
                    padding={20}
                >
                    <Box
                        flex={isBelowMobile ? undefined : '0 1 365px'}
                        width={isBelowMobile ? '100%' : undefined}
                        maxWidth={isBelowMobile ? undefined : 365}
                        minWidth={0}
                    >
                        <ReferralCard
                            rewardAmount={rewardAmount}
                            minimumOrderAmount={minimumOrderAmount}
                            friendDiscountPercentage={friendDiscountPercentage}
                        />
                    </Box>
                    <Column
                        flex={isBelowMobile ? undefined : '1 1 280px'}
                        width={isBelowMobile ? '100%' : undefined}
                        minWidth={0}
                        gap={24}
                        justifyContent="space-between"
                        alignItems={isBelowMobile ? 'center' : 'flex-end'}
                    >
                        <Column gap={0} alignItems={isBelowTablet ? 'center' : 'flex-end'}>
                            <H3
                                typographyStyle={isBelowTablet ? 'body-md' : 'headline-sm'}
                                align={isBelowMobile ? 'center' : 'end'}
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
                            size={isBelowTablet ? 'medium' : 'large'}
                            onClick={onJoin}
                        >
                            <Translation id="TR_REFERRAL_JOIN_PROGRAM" />
                        </Button>
                    </Column>
                </Flex>
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
