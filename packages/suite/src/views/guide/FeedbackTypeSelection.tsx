import React from 'react';
import { Translation } from '@suite-components';
import * as guideActions from '@suite-actions/guideActions';
import { useActions, useDevice } from '@suite-hooks';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { getFwVersion } from '@suite-utils/device';
import { ViewWrapper, Header, Content } from '@guide-components';

const FeedbackTypeButton = styled.button`
    border: 0;
    left: auto;
    cursor: pointer;
    border-radius: 8px;
    width: 100%;
    background: ${props => props.theme.BG_GREY};
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    padding: 10px 13px;
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

const DetailItem = styled.div``;

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
    const { setView } = useActions({
        setView: guideActions.setView,
    });
    const { device } = useDevice();
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
                <FeedbackTypeButton onClick={() => setView('FEEDBACK_BUG')}>
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
                <FeedbackTypeButton onClick={() => setView('FEEDBACK_SUGGESTION')}>
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
                        <Translation id="TR_APP" />: {process.env.VERSION}
                    </DetailItem>
                    <DetailItem>
                        <Translation id="TR_FIRMWARE" />: {firmwareVersion}
                    </DetailItem>
                </Details>
            </Content>
        </ViewWrapper>
    );
};

export default FeedbackTypeSelection;
