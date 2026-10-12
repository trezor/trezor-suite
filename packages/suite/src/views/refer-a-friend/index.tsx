import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    Box,
    Button,
    Card,
    Collapsible,
    Column,
    H3,
    Link,
    Paragraph,
    Row,
    Select,
    StepList,
    Text,
} from '@trezor/components';
import { CaretDownIcon, CaretUpDownIcon } from '@trezor/icons';

import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { LeaveProgramModal } from './LeaveProgramModal';
import { ReferralCard } from './ReferralCard';
import { ReferralDisconnected } from './ReferralDisconnected';
import { ReferralLinkCard } from './ReferralLinkCard';
import { ReferralRewards } from './ReferralRewards';
import { mockReferralProgram, mockReferralScenarios } from './mockReferralProgram';
import { getReferralRewardsSummary } from './referralRewardsUtils';

const referralSteps: { title: TranslationKey; description: TranslationKey }[] = [
    { title: 'TR_REFERRAL_GET_LINK', description: 'TR_REFERRAL_GET_LINK_DESCRIPTION' },
    { title: 'TR_REFERRAL_INVITE_FRIENDS', description: 'TR_REFERRAL_INVITE_FRIENDS_DESCRIPTION' },
    { title: 'TR_REFERRAL_SPEND_REWARDS', description: 'TR_REFERRAL_SPEND_REWARDS_DESCRIPTION' },
];

const mockScenarioOptions: { value: keyof typeof mockReferralScenarios; label: string }[] = [
    { value: 'allStates', label: 'Active vouchers' },
    { value: 'empty', label: 'No vouchers' },
    { value: 'limitReached', label: 'Limit reached' },
];

type ReferralFAQ = {
    question: TranslationKey;
    answer: TranslationKey;
    visibility: 'before' | 'after' | 'both';
};

const referralFAQs: ReferralFAQ[] = [
    {
        question: 'TR_REFERRAL_FAQ_PROGRAM',
        answer: 'TR_REFERRAL_FAQ_PROGRAM_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_JOIN',
        answer: 'TR_REFERRAL_FAQ_JOIN_ANSWER',
        visibility: 'before',
    },
    {
        question: 'TR_REFERRAL_FAQ_SHARE',
        answer: 'TR_REFERRAL_FAQ_SHARE_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_LIMIT',
        answer: 'TR_REFERRAL_FAQ_LIMIT_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_REDEEM',
        answer: 'TR_REFERRAL_FAQ_REDEEM_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_COMBINE',
        answer: 'TR_REFERRAL_FAQ_COMBINE_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_SUPPORT',
        answer: 'TR_REFERRAL_FAQ_SUPPORT_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_OLD_PROGRAM',
        answer: 'TR_REFERRAL_FAQ_OLD_PROGRAM_ANSWER',
        visibility: 'both',
    },
    {
        question: 'TR_REFERRAL_FAQ_LEAVE',
        answer: 'TR_REFERRAL_FAQ_LEAVE_ANSWER',
        visibility: 'after',
    },
];

export const ReferAFriend = () => {
    const [isJoined, setIsJoined] = useState(false);
    const [mockScenario, setMockScenario] =
        useState<keyof typeof mockReferralScenarios>('allStates');
    const leaveModal = useModal();
    const device = useSelector(selectSelectedDevice);
    const isDeviceConnected = !!device?.connected;
    const closeLeaveModal = leaveModal.closeModal;
    const { formatNumber, formatDate } = useIntl();
    const isNarrowContent = useIsContentBelowBreakpoint();
    const {
        fiatCurrency,
        rewardAmount,
        minimumOrderAmount,
        friendDiscountPercentage,
        annualReferralLimit,
        annualRewardLimit,
    } = mockReferralProgram;
    const doubleRewardAmount = rewardAmount * 2;
    const translationValues = {
        rewardAmount: formatNumber(rewardAmount, {
            style: 'currency',
            currency: fiatCurrency,
            maximumFractionDigits: 0,
        }),
        minimumOrderAmount: formatNumber(minimumOrderAmount, {
            style: 'currency',
            currency: fiatCurrency,
            maximumFractionDigits: 0,
        }),
        annualRewardLimit: formatNumber(annualRewardLimit, {
            style: 'currency',
            currency: fiatCurrency,
            maximumFractionDigits: 0,
        }),
        friendDiscountPercentage,
        annualReferralLimit,
        doubleRewardAmount: formatNumber(doubleRewardAmount, {
            style: 'currency',
            currency: fiatCurrency,
            maximumFractionDigits: 0,
        }),
        doubleRewardReferralLimit: annualRewardLimit / doubleRewardAmount,
    };
    const faqItems = referralFAQs.filter(
        faq => faq.visibility === 'both' || faq.visibility === (isJoined ? 'after' : 'before'),
    );
    const vouchers = mockReferralScenarios[mockScenario];
    const rewardsSummary = getReferralRewardsSummary(vouchers, rewardAmount);
    const isLimitReached =
        rewardsSummary.totalEarned >= annualRewardLimit ||
        rewardsSummary.referralCount >= annualReferralLimit;

    useLayout('Refer-A-Friend', <PageHeader />);

    useEffect(() => {
        if (!isDeviceConnected) {
            closeLeaveModal();
        }
    }, [isDeviceConnected, closeLeaveModal]);

    if (!isDeviceConnected) {
        return (
            <Column width="100%" data-testid="@referral/page">
                <ReferralDisconnected />
            </Column>
        );
    }

    return (
        <Column
            width="100%"
            maxWidth={760}
            margin={{ horizontal: 'auto' }}
            gap={24}
            data-testid="@referral/page"
        >
            {isJoined ? (
                <>
                    <Select
                        label="Debug: mock state"
                        aria-label="Debug: mock state"
                        size="medium"
                        options={mockScenarioOptions}
                        value={mockScenarioOptions.find(option => option.value === mockScenario)}
                        onChange={option => setMockScenario(option.value)}
                        isClearable={false}
                        data-testid="@referral/debug/mock-state"
                    />
                    <ReferralLinkCard
                        referralLink={mockReferralProgram.referralLink}
                        rewardAmount={translationValues.rewardAmount}
                        minimumOrderAmount={translationValues.minimumOrderAmount}
                        friendDiscountPercentage={friendDiscountPercentage}
                        annualReferralLimit={annualReferralLimit}
                        annualRewardLimit={translationValues.annualRewardLimit}
                        doubleRewardAmount={translationValues.doubleRewardAmount}
                        doubleRewardReferralLimit={translationValues.doubleRewardReferralLimit}
                        rewardWaitingPeriodDays={mockReferralProgram.rewardWaitingPeriodDays}
                        nextResetDate={formatDate(mockReferralProgram.nextResetDate, {
                            dateStyle: 'long',
                            timeZone: 'UTC',
                        })}
                        isLimitReached={isLimitReached}
                    />
                    <ReferralRewards
                        vouchers={vouchers}
                        rewardAmount={rewardAmount}
                        fiatCurrency={fiatCurrency}
                        annualRewardLimit={annualRewardLimit}
                        annualReferralLimit={annualReferralLimit}
                        rewardWaitingPeriodDays={mockReferralProgram.rewardWaitingPeriodDays}
                    />
                </>
            ) : (
                <Column gap={12}>
                    <Card paddingType="none">
                        <Row gap={24} alignItems="stretch" padding={20}>
                            <ReferralCard
                                rewardAmount={translationValues.rewardAmount}
                                minimumOrderAmount={translationValues.minimumOrderAmount}
                                friendDiscountPercentage={friendDiscountPercentage}
                            />
                            <Column
                                flex="1 1 280px"
                                minWidth={0}
                                gap={24}
                                justifyContent="space-between"
                                alignItems={isNarrowContent ? 'stretch' : 'flex-end'}
                            >
                                <Column
                                    gap={0}
                                    alignItems={isNarrowContent ? 'flex-start' : 'flex-end'}
                                >
                                    <H3 typographyStyle="headline-sm">
                                        <Translation id="TR_REFERRAL_INVITATION_TITLE" />
                                    </H3>
                                    <Paragraph
                                        typographyStyle="body-sm"
                                        intent="neutral"
                                        priority="secondary"
                                    >
                                        <Translation
                                            id="TR_REFERRAL_INVITATION_DESCRIPTION"
                                            values={translationValues}
                                        />
                                    </Paragraph>
                                </Column>
                                <Button
                                    data-testid="@referral/join"
                                    onClick={() => setIsJoined(true)}
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
                                    <Link href="https://www.trezor.io/privacy">{chunks}</Link>
                                ),
                                programTerms: chunks => (
                                    <Link href="https://www.trezor.io/privacy">{chunks}</Link>
                                ),
                                generalTerms: chunks => (
                                    <Link href="https://www.trezor.io/privacy">{chunks}</Link>
                                ),
                            }}
                        />
                    </Paragraph>
                </Column>
            )}
            <Card type="sunken" paddingType="none">
                <Collapsible
                    key={isJoined ? 'joined' : 'not-joined'}
                    defaultIsOpen={!isJoined}
                    data-testid="@referral/how-it-works"
                    gap={8}
                >
                    <Column>
                        <Collapsible.Toggle>
                            <Row
                                gap={8}
                                padding={{ horizontal: 20, vertical: 12 }}
                                justifyContent="space-between"
                            >
                                <Text typographyStyle="body-md">
                                    <Translation id="TR_REFERRAL_HOW_IT_WORKS" />
                                </Text>
                                <Collapsible.ToggleIcon icon={CaretUpDownIcon} size={20} />
                            </Row>
                        </Collapsible.Toggle>
                        <Collapsible.Content>
                            <Box padding={{ bottom: 20, horizontal: 20 }}>
                                <StepList
                                    isOrdered
                                    bulletSize="large"
                                    bulletGap={24}
                                    titleGap={0}
                                    gap={16}
                                    lineWidth={1}
                                >
                                    {referralSteps.map(({ title, description }) => (
                                        <StepList.Item
                                            key={title}
                                            title={
                                                <Text typographyStyle="body-md-strong">
                                                    <Translation id={title} />
                                                </Text>
                                            }
                                        >
                                            <Paragraph
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                            >
                                                <Translation
                                                    id={description}
                                                    values={translationValues}
                                                />
                                            </Paragraph>
                                        </StepList.Item>
                                    ))}
                                </StepList>
                            </Box>
                        </Collapsible.Content>
                    </Column>
                </Collapsible>
            </Card>
            <Card type="sunken" paddingType="none">
                <Collapsible
                    key={isJoined ? 'joined' : 'not-joined'}
                    defaultIsOpen={!isJoined}
                    data-testid="@referral/faq"
                >
                    <Collapsible.Toggle>
                        <Row
                            gap={8}
                            justifyContent="space-between"
                            padding={{ vertical: 12, horizontal: 20 }}
                        >
                            <Text typographyStyle="body-md">
                                <Translation id="TR_REFERRAL_FAQ_TITLE" />
                            </Text>
                            <Collapsible.ToggleIcon icon={CaretUpDownIcon} size={20} />
                        </Row>
                    </Collapsible.Toggle>
                    <Collapsible.Content>
                        <Column hasDivider dividerColor="surfaceBorderSunken">
                            {faqItems.map(({ question, answer }) => (
                                <Collapsible
                                    key={question}
                                    data-testid={`@referral/faq/${question}`}
                                >
                                    <Column>
                                        <Collapsible.Toggle>
                                            <Row
                                                padding={{ vertical: 16, horizontal: 20 }}
                                                gap={8}
                                                justifyContent="space-between"
                                            >
                                                <Text typographyStyle="body-sm">
                                                    <Translation
                                                        id={question}
                                                        values={translationValues}
                                                    />
                                                </Text>
                                                <Collapsible.ToggleIcon
                                                    icon={CaretDownIcon}
                                                    size={20}
                                                />
                                            </Row>
                                        </Collapsible.Toggle>
                                        <Collapsible.Content>
                                            <Paragraph
                                                typographyStyle="body-sm"
                                                intent="neutral"
                                                priority="secondary"
                                                padding={{ bottom: 16, horizontal: 20 }}
                                            >
                                                <Translation
                                                    id={answer}
                                                    values={{
                                                        ...translationValues,
                                                        leaveProgram: chunks => (
                                                            <Link
                                                                data-testid="@referral/leave"
                                                                onClick={event => {
                                                                    event.preventDefault();
                                                                    leaveModal.openModal();
                                                                }}
                                                            >
                                                                {chunks}
                                                            </Link>
                                                        ),
                                                    }}
                                                />
                                            </Paragraph>
                                        </Collapsible.Content>
                                    </Column>
                                </Collapsible>
                            ))}
                        </Column>
                    </Collapsible.Content>
                </Collapsible>
            </Card>
            {leaveModal.open && (
                <LeaveProgramModal
                    onCancel={leaveModal.closeModal}
                    onConfirm={() => {
                        setIsJoined(false);
                        leaveModal.closeModal();
                    }}
                />
            )}
        </Column>
    );
};
