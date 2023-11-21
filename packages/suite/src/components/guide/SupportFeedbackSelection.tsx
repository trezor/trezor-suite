import styled from 'styled-components';

import { TREZOR_FORUM_URL, TREZOR_SUPPORT_URL } from '@trezor/urls';
import { analytics, EventType } from '@trezor/suite-analytics';
import { resolveStaticPath, isDevEnv } from '@suite-common/suite-utils';
import { Icon, Link, variables } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { getFirmwareVersion } from '@trezor/device-utils';
import { selectDevice } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { setView } from 'src/actions/suite/guideActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { GuideViewWrapper, GuideHeader, GuideContent } from 'src/components/guide';
import { UpdateState } from 'src/reducers/suite/desktopUpdateReducer';

const Section = styled.div`
    & + & {
        margin-top: 50px;
    }
`;

const SectionHeader = styled.h3`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    padding: 0 0 18px;
`;

const SectionButton = styled.button<{ hasBackground?: boolean }>`
    left: auto;
    cursor: pointer;
    border-radius: 8px;
    width: 100%;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    padding: 13px;
    background: ${({ hasBackground, theme }) =>
        hasBackground ? theme.backgroundSurfaceElevation1 : 'none'};
    border: 0;

    transition: ${({ theme }) =>
        `background ${theme.HOVER_TRANSITION_TIME} ${theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${({ theme }) => theme.backgroundTertiaryPressedOnElevation1};
    }
`;

const StyledLink = styled(Link)`
    width: 100%;
`;

const Details = styled.div`
    padding: 10px 0 0;
    font-size: 10px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    display: flex;
    justify-content: space-around;
`;

const ButtonImage = styled.img`
    display: block;
    margin-right: 10px;
`;

const DetailItem = styled.div`
    display: inline-flex;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    padding: 0 6px;
`;

const Label = styled.div`
    padding: 0 0 0 5px;
    text-align: left;
    width: 100%;
`;

const LabelHeadline = styled.strong`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    display: flex;
    align-items: center;
    justify-content: space-between;

    :not(:only-child) {
        margin-bottom: 5px;
    }
`;

const LabelSubheadline = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

export const SupportFeedbackSelection = () => {
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const device = useSelector(selectDevice);
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
            type: EventType.GuideFeedbackNavigation,
            payload: { type: 'bug' },
        });
    };
    const handleFeedbackButtonClick = () => {
        dispatch(setView('FEEDBACK_SUGGESTION'));
        analytics.report({
            type: EventType.GuideFeedbackNavigation,
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
                        hasBackground
                        data-test="@guide/feedback/bug"
                    >
                        <ButtonImage
                            src={resolveStaticPath('images/png/recovery@2x.png')}
                            width="48"
                            height="48"
                            alt=""
                        />
                        <Label>
                            <LabelHeadline>
                                <Translation id="TR_BUG" />
                            </LabelHeadline>
                            <LabelSubheadline>
                                <Translation id="TR_GUIDE_BUG_LABEL" />
                            </LabelSubheadline>
                        </Label>
                    </SectionButton>
                    <SectionButton
                        onClick={handleFeedbackButtonClick}
                        hasBackground
                        data-test="@guide/feedback/suggestion"
                    >
                        <ButtonImage
                            src={resolveStaticPath('images/png/understand@2x.png')}
                            width="48"
                            height="48"
                            alt=""
                        />
                        <Label>
                            <LabelHeadline>
                                <Translation id="TR_SUGGESTION" />
                            </LabelHeadline>
                            <LabelSubheadline>
                                <Translation id="TR_GUIDE_SUGGESTION_LABEL" />
                            </LabelSubheadline>
                        </Label>
                    </SectionButton>
                </Section>

                <Section>
                    <SectionHeader>
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_NEED_HELP" />
                    </SectionHeader>

                    <StyledLink href={TREZOR_FORUM_URL} variant="nostyle">
                        <SectionButton data-test="@guide/forum">
                            <Label>
                                <LabelHeadline>
                                    <Translation id="TR_GUIDE_FORUM" />
                                    <Icon size={20} icon="EXTERNAL_LINK" />
                                </LabelHeadline>
                                <LabelSubheadline>
                                    <Translation id="TR_GUIDE_FORUM_LABEL" />
                                </LabelSubheadline>
                            </Label>
                        </SectionButton>
                    </StyledLink>

                    <StyledLink href={TREZOR_SUPPORT_URL} variant="nostyle">
                        <SectionButton data-test="@guide/support">
                            <Label>
                                <LabelHeadline>
                                    <Translation id="TR_GUIDE_SUPPORT" />
                                    <Icon size={20} icon="EXTERNAL_LINK" />
                                </LabelHeadline>
                            </Label>
                        </SectionButton>
                    </StyledLink>
                </Section>

                <Details>
                    <DetailItem data-test="@guide/support/version">
                        <Translation id="TR_APP" />
                        :&nbsp;
                        {!isDevEnv && appUpToDate ? (
                            <>
                                <StyledIcon icon="CHECK" size={10} />
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
                                <StyledIcon icon="CHECK" size={10} />
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
