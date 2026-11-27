import { type ReactNode, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import {
    fetchReferralAccountThunk,
    fetchReferralProgramThunk,
    selectDoesReferralExistOnlyForOtherWallets,
    selectIsReferralWalletDescriptorAvailable,
    selectReferralAccountState,
    selectReferralAnnualRewardLimit,
    selectReferralProgram,
    selectReferralWalletRecord,
} from '@suite-common/refer-a-friend';
import {
    Box,
    Card,
    Collapsible,
    Column,
    Paragraph,
    Row,
    StepList,
    Text,
    TextButton,
} from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CaretDownIcon, CaretUpDownIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import {
    LeaveProgramModal,
    PageHeader,
    ReferralDisconnected,
    ReferralError,
    ReferralInvitation,
    ReferralJoinedContent,
    ReferralLoading,
    ReferralOtherWalletBanner,
    ReferralUnavailable,
    selectIsReferAFriendAvailableInApp,
    useLayout,
    useModal,
    useReferralActions,
} from '@trezor/suite';

import { useReferAFriendAutoRefresh } from '../hooks/useReferAFriendAutoRefresh';

const referralSteps: { title: TranslationKey; description: TranslationKey }[] = [
    { title: 'TR_REFERRAL_GET_LINK', description: 'TR_REFERRAL_GET_LINK_DESCRIPTION' },
    { title: 'TR_REFERRAL_INVITE_FRIENDS', description: 'TR_REFERRAL_INVITE_FRIENDS_DESCRIPTION' },
    { title: 'TR_REFERRAL_SPEND_REWARDS', description: 'TR_REFERRAL_SPEND_REWARDS_DESCRIPTION' },
];

type ReferralFAQ = {
    id: string;
    question: ReactNode;
    answer: ReactNode;
    visibility: 'before' | 'after' | 'both';
};

export const ReferAFriendPage = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceId = device?.id ?? undefined;
    const isReferralAvailable = useSelector(selectIsReferAFriendAvailableInApp);
    const program = useSelector(selectReferralProgram);
    const annualRewardLimit = useSelector(selectReferralAnnualRewardLimit);
    const isReferralWalletDescriptorAvailable = useSelector(
        selectIsReferralWalletDescriptorAvailable,
    );
    const walletRecord = useSelector(selectReferralWalletRecord);
    const accountState = useSelector(selectReferralAccountState);
    const doesReferralAccountExistOnlyForOtherWalletDescriptors = useSelector(
        selectDoesReferralExistOnlyForOtherWallets,
    );

    const leaveModal = useModal();
    const { dispatch } = useServices(injectDispatch);
    const { formatNumber } = useIntl();
    const { join, leave } = useReferralActions();

    const isDeviceConnected = !!device?.connected;
    const shareUrl = walletRecord?.shareUrl ?? null;
    const isJoined = shareUrl !== null;
    const closeLeaveModal = leaveModal.closeModal;

    useLayout('Refer-A-Friend', <PageHeader />);
    useReferAFriendAutoRefresh({ isEnabled: isReferralAvailable, deviceId });

    useEffect(() => {
        if (!isReferralAvailable) return;

        dispatch(fetchReferralProgramThunk());
    }, [isReferralAvailable, dispatch]);

    useEffect(() => {
        if (
            !isReferralAvailable ||
            deviceId === undefined ||
            !isReferralWalletDescriptorAvailable
        ) {
            return;
        }

        dispatch(fetchReferralAccountThunk({ deviceId }));
    }, [isReferralAvailable, deviceId, isReferralWalletDescriptorAvailable, dispatch]);

    useEffect(() => {
        if (!isReferralAvailable || !isJoined) {
            closeLeaveModal();
        }
    }, [isReferralAvailable, isJoined, closeLeaveModal]);

    if (!isReferralAvailable) {
        return <ReferralUnavailable description="TR_REFERRAL_UNAVAILABLE" />;
    }

    // All referral data belong to the standard wallet, without it there is nothing to show.
    if (!isReferralWalletDescriptorAvailable) {
        return <ReferralUnavailable description="TR_REFERRAL_OPEN_STANDARD_WALLET" />;
    }

    if (program.status === 'error') {
        return (
            <Column width="100%" maxWidth={760} margin={{ horizontal: 'auto' }}>
                <ReferralError
                    title="TR_REFERRAL_ERROR_PROGRAM"
                    onRetry={() => dispatch(fetchReferralProgramThunk())}
                />
            </Column>
        );
    }

    // annualRewardLimit is guaranteed to be defined if program.data is valid, see fetchReferralProgramThunk.
    if (program.data === null || annualRewardLimit === null) {
        return <ReferralLoading />;
    }

    if (!isJoined && !isDeviceConnected) {
        return (
            <Column width="100%" data-testid="@referral/page">
                <ReferralDisconnected />
            </Column>
        );
    }

    const { fiatCurrency, rewardAmount, minimumOrderAmount, friendDiscountPercentage, termsUrl } =
        program.data;
    const annualReferralLimit =
        accountState.account?.redemptionLimit ?? program.data.redemptionLimit;
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
            id: 'program',
            question: <Translation id="TR_REFERRAL_FAQ_PROGRAM" />,
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
            id: 'join',
            question: <Translation id="TR_REFERRAL_FAQ_JOIN" />,
            answer: <Translation id="TR_REFERRAL_FAQ_JOIN_ANSWER" />,
            visibility: 'before',
        },
        {
            id: 'share',
            question: <Translation id="TR_REFERRAL_FAQ_SHARE" />,
            answer: <Translation id="TR_REFERRAL_FAQ_SHARE_ANSWER" />,
            visibility: 'both',
        },
        {
            id: 'limit',
            question: <Translation id="TR_REFERRAL_FAQ_LIMIT" />,
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
            id: 'redeem',
            question: (
                <Translation
                    id="TR_REFERRAL_FAQ_REDEEM"
                    values={{ rewardAmount: translationValues.rewardAmount }}
                />
            ),
            answer: <Translation id="TR_REFERRAL_FAQ_REDEEM_ANSWER" />,
            visibility: 'both',
        },
        {
            id: 'combine',
            question: (
                <Translation id="TR_REFERRAL_FAQ_COMBINE" values={{ friendDiscountPercentage }} />
            ),
            answer: <Translation id="TR_REFERRAL_FAQ_COMBINE_ANSWER" />,
            visibility: 'both',
        },
        {
            id: 'support',
            question: <Translation id="TR_REFERRAL_FAQ_SUPPORT" />,
            answer: <Translation id="TR_REFERRAL_FAQ_SUPPORT_ANSWER" />,
            visibility: 'both',
        },
        {
            id: 'old-program',
            question: <Translation id="TR_REFERRAL_FAQ_OLD_PROGRAM" />,
            answer: <Translation id="TR_REFERRAL_FAQ_OLD_PROGRAM_ANSWER" />,
            visibility: 'both',
        },
        {
            id: 'leave',
            question: <Translation id="TR_REFERRAL_FAQ_LEAVE" />,
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

    return (
        <Column
            width="100%"
            maxWidth={760}
            margin={{ horizontal: 'auto' }}
            gap={24}
            data-testid="@referral/page"
        >
            {isJoined && deviceId !== undefined ? (
                <ReferralJoinedContent
                    deviceId={deviceId}
                    shareUrl={shareUrl}
                    program={program.data}
                    annualRewardLimit={annualRewardLimit}
                />
            ) : (
                <>
                    <ReferralInvitation
                        rewardAmount={translationValues.rewardAmount}
                        minimumOrderAmount={translationValues.minimumOrderAmount}
                        friendDiscountPercentage={friendDiscountPercentage}
                        termsUrl={termsUrl}
                        isJoining={accountState.pendingAction === 'join'}
                        onJoin={join}
                    />
                    {doesReferralAccountExistOnlyForOtherWalletDescriptors && (
                        <ReferralOtherWalletBanner />
                    )}
                </>
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
                            {faqItems.map(({ id, question, answer }) => (
                                <Collapsible key={id}>
                                    <Column>
                                        <Collapsible.Toggle>
                                            <Row
                                                padding={{ vertical: 16, horizontal: 20 }}
                                                gap={8}
                                                justifyContent="space-between"
                                            >
                                                <Text typographyStyle="body-sm">{question}</Text>
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
                        leaveModal.closeModal();
                        leave();
                    }}
                />
            )}
        </Column>
    );
};
