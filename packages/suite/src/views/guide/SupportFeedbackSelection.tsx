import React from 'react';
import { darken } from 'polished';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import * as guideActions from '@suite-actions/guideActions';
import { useActions, useAnalytics, useSelector } from '@suite-hooks';
import { Icon, Link, variables } from '@trezor/components';
import { isDev } from '@suite-utils/build';
import { resolveStaticPath } from '@trezor/utils';
import { getFwVersion } from '@suite-utils/device';
import { ViewWrapper, Header, Content } from '@guide-components';
import { isDesktop } from '@suite-utils/env';
import { UpdateState } from '@suite-reducers/desktopUpdateReducer';
import { FORUM_URL, SUPPORT_URL } from '@suite-constants/urls';

const Section = styled.div`
    :not(:last-of-type) {
        margin-bottom: 50px;
    }
`;

const SectionHeader = styled.h3`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding: 0 0 18px 0;
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
    background: ${props => (props.hasBackground ? props.theme.BG_GREY_ALT : 'none')};
    border: 2px solid ${props => props.theme.BG_GREY_ALT};

    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_GREY_ALT)};
    }
`;

const StyledLink = styled(Link)`
    width: 100%;
`;

const Details = styled.p`
    padding: 10px 0 0 0;
    font-size: 10px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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
    color: ${props => props.theme.TYPE_DARK_GREY};
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const SupportFeedbackSelection = () => {
    const analytics = useAnalytics();
    const { setView } = useActions({
        setView: guideActions.setView,
    });
    const { desktopUpdate, device } = useSelector(state => ({
        desktopUpdate: state.desktopUpdate,
        device: state.suite.device,
    }));

    const appUpToDate =
        isDesktop() &&
        [UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdate.state);

    const firmwareUpToDate = device?.firmware === 'valid';
    const firmwareVersion = device?.features ? (
        getFwVersion(device) || <Translation id="TR_DEVICE_FW_UNKNOWN" />
    ) : (
        <Translation id="TR_DEVICE_NOT_CONNECTED" />
    );

    return (
        <ViewWrapper>
            <Header
                back={() => setView('GUIDE_DEFAULT')}
                label={<Translation id="TR_GUIDE_VIEW_HEADLINES_SUPPORT_FEEDBACK_SELECTION" />}
            />
            <Content>
                <Section>
                    <SectionHeader>
                        <Translation id="TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE" />
                    </SectionHeader>
                    <SectionButton
                        onClick={() => {
                            setView('FEEDBACK_BUG');
                            analytics.report({
                                type: 'guide/feedback/navigation',
                                payload: { type: 'bug' },
                            });
                        }}
                        hasBackground
                        data-test="@guide/feedback/bug"
                    >
                        <ButtonImage
                            src={resolveStaticPath('images/suite/3d/recovery.png')}
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
                        onClick={() => {
                            setView('FEEDBACK_SUGGESTION');
                            analytics.report({
                                type: 'guide/feedback/navigation',
                                payload: { type: 'suggestion' },
                            });
                        }}
                        hasBackground
                        data-test="@guide/feedback/suggestion"
                    >
                        <ButtonImage
                            src={resolveStaticPath('images/suite/3d/understand.png')}
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

                    <StyledLink href={FORUM_URL} variant="nostyle">
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

                    <StyledLink href={SUPPORT_URL} variant="nostyle">
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
                        {!isDev && appUpToDate ? (
                            <>
                                <StyledIcon icon="CHECK" size={10} />
                                <Translation id="TR_UP_TO_DATE" />
                            </>
                        ) : (
                            <>
                                {process.env.VERSION}
                                {isDev && '-dev'}
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
            </Content>
        </ViewWrapper>
    );
};

export default SupportFeedbackSelection;
