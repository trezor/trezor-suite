import React from 'react';
import { darken } from 'polished';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import * as guideActions from '@suite-actions/guideActions';
import { useActions, useAnalytics, useSelector } from '@suite-hooks';
import { Icon, variables } from '@trezor/components';
import { isDev, resolveStaticPath } from '@suite-utils/build';
import { getFwVersion } from '@suite-utils/device';
import { ViewWrapper, Header, Content } from '@guide-components';
import { isDesktop } from '@suite-utils/env';

const FeedbackTypeButton = styled.button`
    border: 0;
    left: auto;
    cursor: pointer;
    border-radius: 8px;
    width: 100%;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    padding: 10px 13px;
    background: ${props => props.theme.BG_GREY_ALT};

    transition: ${props =>
        `background ${props.theme.HOVER_TRANSITION_TIME} ${props.theme.HOVER_TRANSITION_EFFECT}`};

    &:hover {
        background: ${props => darken(props.theme.HOVER_DARKEN_FILTER, props.theme.BG_GREY_ALT)};
    }
`;

const Details = styled.div`
    padding: 10px 0 0 0;
    font-size: 10px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: flex;
    justify-content: space-around;
`;

const FeedbackButtonImage = styled.img`
    display: block;
`;

const DetailItem = styled.div`
    display: inline-flex;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    padding: 0 6px;
`;

const Label = styled.div`
    padding: 0 0 0 15px;
    text-align: left;
`;

const LabelHeadline = styled.strong`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const LabelSubheadline = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const FeedbackTypeSelection = () => {
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
        ['checking', 'not-available'].includes(desktopUpdate.state) &&
        !desktopUpdate.skip;

    const firmwareUpToDate = device?.firmware === 'valid';
    const firmwareVersion = device?.features ? (
        getFwVersion(device)
    ) : (
        <Translation id="TR_DEVICE_NOT_CONNECTED" />
    );

    return (
        <ViewWrapper>
            <Header
                back={() => setView('GUIDE_DEFAULT')}
                label={<Translation id="TR_GUIDE_VIEW_HEADLINE_HELP_US_IMPROVE" />}
            />
            <Content>
                <FeedbackTypeButton
                    onClick={() => {
                        setView('FEEDBACK_BUG');
                        analytics.report({
                            type: 'guide/feedback/navigation',
                            payload: { type: 'bug' },
                        });
                    }}
                    data-test="@guide/feedback/bug"
                >
                    <FeedbackButtonImage
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
                </FeedbackTypeButton>
                <FeedbackTypeButton
                    onClick={() => {
                        setView('FEEDBACK_SUGGESTION');
                        analytics.report({
                            type: 'guide/feedback/navigation',
                            payload: { type: 'suggestion' },
                        });
                    }}
                    data-test="@guide/feedback/suggestion"
                >
                    <FeedbackButtonImage
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
                </FeedbackTypeButton>
                <Details>
                    <DetailItem>
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

export default FeedbackTypeSelection;
