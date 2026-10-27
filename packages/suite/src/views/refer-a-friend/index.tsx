import { type ReactNode, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectIsDeviceUsingPassphrase, selectSelectedDevice } from '@suite-common/device';
import {
    Box,
    Card,
    Collapsible,
    Column,
    Paragraph,
    Row,
    Select,
    StepList,
    Text,
    TextButton,
} from '@trezor/components';
import { CaretDownIcon, CaretUpDownIcon } from '@trezor/icons';

import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { useLayout } from 'src/hooks/suite';

import { LeaveProgramModal } from './LeaveProgramModal';
import { ReferralDisconnected } from './ReferralDisconnected';
import { ReferralInvitation } from './ReferralInvitation';
import { ReferralLinkCard } from './ReferralLinkCard';
import { ReferralRewards } from './ReferralRewards';
import { ReferralUnavailable } from './ReferralUnavailable';
import { mockReferralProgram, mockReferralScenarios } from './mockReferralProgram';
import { getReferralRewardsSummary } from './referralRewardsUtils';
import { selectIsReferralAvailable } from './referralSelectors';

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
    answer: ReactNode;
    questionValues?: { rewardAmount: string } | { friendDiscountPercentage: number };
    visibility: 'before' | 'after' | 'both';
};

export const ReferAFriend = () => {
    const [isJoined, setIsJoined] = useState(false);
    const [mockScenario, setMockScenario] =
        useState<keyof typeof mockReferralScenarios>('allStates');
    const leaveModal = useModal();
    const device = useSelector(selectSelectedDevice);
    const isReferralAvailable = useSelector(selectIsReferralAvailable);
    const isDeviceUsingPassphrase = useSelector(selectIsDeviceUsingPassphrase);
    const isDeviceConnected = !!device?.connected;
    const closeLeaveModal = leaveModal.closeModal;
    const { formatNumber, formatDate } = useIntl();
    const {
        fiatCurrency,
        rewardAmount,
        minimumOrderAmount,
        friendDiscountPercentage,
        annualReferralLimit,
        annualRewardLimit,
    } = mockReferralProgram;
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
    };
    const referralFAQs: ReferralFAQ[] = [
        {
            question: 'TR_REFERRAL_FAQ_PROGRAM',
            answer: (
                <Translation
                    id="TR_REFERRAL_FAQ_PROGRAM_ANSWER"
                    values={{
                        minimumOrderAmount: translationValues.minimumOrderAmount,
                        friendDiscountPercentage,
                        rewardAmount: translationValues.rewardAmount,
                    }}
                />
            ),
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_JOIN',
            answer: <Translation id="TR_REFERRAL_FAQ_JOIN_ANSWER" />,
            visibility: 'before',
        },
        {
            question: 'TR_REFERRAL_FAQ_SHARE',
            answer: <Translation id="TR_REFERRAL_FAQ_SHARE_ANSWER" />,
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_LIMIT',
            answer: (
                <Translation
                    id="TR_REFERRAL_FAQ_LIMIT_ANSWER"
                    values={{
                        annualReferralLimit,
                        annualRewardLimit: translationValues.annualRewardLimit,
                        friendDiscountPercentage,
                    }}
                />
            ),
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_REDEEM',
            questionValues: { rewardAmount: translationValues.rewardAmount },
            answer: <Translation id="TR_REFERRAL_FAQ_REDEEM_ANSWER" />,
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_COMBINE',
            questionValues: { friendDiscountPercentage },
            answer: <Translation id="TR_REFERRAL_FAQ_COMBINE_ANSWER" />,
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_SUPPORT',
            answer: <Translation id="TR_REFERRAL_FAQ_SUPPORT_ANSWER" />,
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_OLD_PROGRAM',
            answer: <Translation id="TR_REFERRAL_FAQ_OLD_PROGRAM_ANSWER" />,
            visibility: 'both',
        },
        {
            question: 'TR_REFERRAL_FAQ_LEAVE',
            answer: (
                <Translation
                    id="TR_REFERRAL_FAQ_LEAVE_ANSWER"
                    values={{
                        leaveProgram: chunks => (
                            <TextButton
                                isUnderlined
                                intent="neutral"
                                size="small"
                                data-testid="@referral/leave"
                                onClick={leaveModal.openModal}
                            >
                                {chunks}
                            </TextButton>
                        ),
                    }}
                />
            ),
            visibility: 'after',
        },
    ];
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
        if (!isDeviceConnected || !isReferralAvailable || isDeviceUsingPassphrase) {
            closeLeaveModal();
        }
    }, [isDeviceConnected, isReferralAvailable, isDeviceUsingPassphrase, closeLeaveModal]);

    if (!isReferralAvailable) {
        return <ReferralUnavailable description="TR_REFERRAL_UNAVAILABLE" />;
    }

    if (isDeviceUsingPassphrase) {
        return <ReferralUnavailable description="TR_REFERRAL_SWITCH_TO_STANDARD_WALLET" />;
    }

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
                <ReferralInvitation
                    rewardAmount={translationValues.rewardAmount}
                    minimumOrderAmount={translationValues.minimumOrderAmount}
                    friendDiscountPercentage={friendDiscountPercentage}
                    onJoin={() => setIsJoined(true)}
                />
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
                            {faqItems.map(({ question, questionValues, answer }) => (
                                <Collapsible key={question}>
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
                                                        values={questionValues}
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
                                                {answer}
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
