import styled from 'styled-components';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { UpdateState } from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { isDevEnv } from '@suite-common/suite-utils';
import { Icon, Paragraph } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { borders, transitions, typography } from '@trezor/theme';
import { TREZOR_FORUM_URL } from '@trezor/urls';

import { setView } from 'src/actions/suite/guideActions';
import { GuideContent, GuideHeader, GuideViewWrapper } from 'src/components/guide';
import { SupportConsentPopover } from 'src/components/guide/SupportConsentPopover';
import { useDispatch, useSelector } from 'src/hooks/suite';

const Section = styled.div`
    & + & {
        margin-top: 50px;
    }
`;

const SectionHeader = styled.h3`
    ${typography['body-sm-strong']}
    color: ${({ theme }) => theme.contentSecondary};
    padding: 0 0 18px;
`;

const SectionButton = styled.button<{ $hasBackground?: boolean }>`
    cursor: pointer;
    border-radius: ${borders.radii.sm};
    width: 100%;
    margin: 0 0 10px;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 13px;
    background: ${({ $hasBackground, theme }) =>
        $hasBackground ? theme.elementFillElevated : 'none'};
    border: 0;

    transition: background ${transitions.speed.normal} ${transitions.type};

    &:hover {
        background: ${({ theme }) => theme.elementFillElevatedHovered};
    }
`;

const Details = styled.div`
    padding: 10px 0 0;
    ${typography['body-xs']}
    color: ${({ theme }) => theme.contentSecondary};
    display: flex;
    justify-content: space-around;
`;

const DetailItem = styled.div`
    display: inline-flex;
    align-items: center;
`;

const Label = styled.div`
    padding: 0 0 0 5px;
    text-align: left;
    flex-grow: 1;
`;

const LabelHeadline = styled.strong`
    ${typography['body-md']}
    color: ${({ theme }) => theme.contentPrimary};
    display: flex;
    align-items: center;
    justify-content: space-between;

    &:not(:only-child) {
        margin-bottom: 5px;
    }
`;

export const SupportFeedbackSelection = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const device = useSelector(selectSelectedDevice);
    const dispatch = useDispatch();

    const appUpToDate =
        isDesktop() &&
        [UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdate.state);

    const firmwareUpToDate = device?.firmware === 'valid';
    const firmwareVersion = device?.features ? (
        getFirmwareVersion(device) || <Translation id="TR_DEVICE_FW_UNKNOWN" />
    ) : (
        <Translation id="TR_DEVICE_NOT_CONNECTED" />
    );

    const goBack = () => dispatch(setView('GUIDE_DEFAULT'));
    const handleBugButtonClick = () => {
        dispatch(setView('FEEDBACK_BUG'));
        analytics.report({
            type: events.guideFeedbackNavigationEvent.name,
            payload: { type: 'bug' },
        });
    };
    const handleFeedbackButtonClick = () => {
        dispatch(setView('FEEDBACK_SUGGESTION'));
        analytics.report({
            type: events.guideFeedbackNavigationEvent.name,
            payload: { type: 'suggestion' },
        });
    };

    return (
        <GuideViewWrapper>
            <GuideHeader
                back={goBack}
                label={<Translation id="TR_GUIDE_VIEW_HEADLINES_SUPPORT_FEEDBACK_SELECTION" />}
            />
            <GuideContent>
                <Section>
                    <SectionHeader>
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE" />
                    </SectionHeader>
                    <SectionButton
                        onClick={handleBugButtonClick}
                        $hasBackground
                        data-testid="@guide/feedback/bug"
                    >
                        <Icon name="lifebuoy" size={40} />
                        <Label>
                            <LabelHeadline>
                                <Translation id="TR_BUG" />
                            </LabelHeadline>
                            <Paragraph
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="TR_GUIDE_BUG_LABEL" />
                            </Paragraph>
                        </Label>
                    </SectionButton>
                    <SectionButton
                        onClick={handleFeedbackButtonClick}
                        $hasBackground
                        data-testid="@guide/feedback/suggestion"
                    >
                        <Icon name="megaphone" size={40} />
                        <Label>
                            <LabelHeadline>
                                <Translation id="TR_SUGGESTION" />
                            </LabelHeadline>
                            <Paragraph
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="TR_GUIDE_SUGGESTION_LABEL" />
                            </Paragraph>
                        </Label>
                    </SectionButton>
                </Section>

                <Section>
                    <SectionHeader>
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_NEED_HELP" />
                    </SectionHeader>

                    <SupportConsentPopover>
                        <SectionButton $hasBackground data-testid="@guide/support">
                            <Label>
                                <LabelHeadline>
                                    <Translation id="TR_GUIDE_SUPPORT" />
                                    <Icon size={20} name="arrowLineUpRight" />
                                </LabelHeadline>
                            </Label>
                        </SectionButton>
                    </SupportConsentPopover>

                    <SectionButton
                        $hasBackground
                        data-testid="@guide/forum"
                        onClick={() => window.open(TREZOR_FORUM_URL, '_blank')}
                    >
                        <Label>
                            <LabelHeadline>
                                <Translation id="TR_GUIDE_FORUM" />
                                <Icon size={20} name="arrowLineUpRight" />
                            </LabelHeadline>
                            <Paragraph
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation id="TR_GUIDE_FORUM_LABEL" />
                            </Paragraph>
                        </Label>
                    </SectionButton>
                </Section>

                <Details>
                    <DetailItem data-testid="@guide/support/version">
                        <Translation id="TR_APP" />
                        :&nbsp;
                        {!isDevEnv && appUpToDate ? (
                            <>
                                <Icon
                                    size={12}
                                    margin={{ horizontal: 4 }}
                                    name="check"
                                    intent="neutral"
                                    priority="secondary"
                                />
                                <Translation id="TR_UP_TO_DATE" />
                            </>
                        ) : (
                            <>
                                {process.env.VERSION}
                                {isDevEnv && '-dev'}
                            </>
                        )}
                    </DetailItem>
                    <DetailItem>
                        <Translation id="TR_FIRMWARE" />
                        :&nbsp;
                        {firmwareUpToDate ? (
                            <>
                                <Icon
                                    size={12}
                                    margin={{ horizontal: 4 }}
                                    name="check"
                                    intent="neutral"
                                    priority="secondary"
                                />
                                <Translation id="TR_UP_TO_DATE" />
                            </>
                        ) : (
                            firmwareVersion
                        )}
                    </DetailItem>
                </Details>
            </GuideContent>
        </GuideViewWrapper>
    );
};
