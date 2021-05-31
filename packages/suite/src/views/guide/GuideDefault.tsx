import React from 'react';
import { Translation } from '@suite-components';
import * as guideActions from '@suite-actions/guideActions';
import { useActions } from '@suite-hooks';
import styled from 'styled-components';
import { Icon, variables, useTheme } from '@trezor/components';
import { Header, Content, ViewWrapper } from '@guide-components';

const FeedbackLinkWrapper = styled.div`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const FeedbackButton = styled.button`
    display: flex;
    align-items: center;
    width: 100%;
    border: 0;
    background: none;
    cursor: pointer;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-align: left;
    padding: 22px;

    &:last-child {
        left: auto;
    }
`;

const FeedbackButtonLabel = styled.div`
    padding: 0 15px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    width: 100%;
`;

const FeedbackButtonLeftIcon = styled(Icon)`
    margin-top: -2px;
`;

const FeedbackButtonRightIcon = styled(Icon)`
    margin-top: -1px;
`;

const Section = styled.section`
    padding: 48px 0 0 0;
`;

const SectionHeading = styled.h3`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    padding: 0 0 11px 0;
`;

const Articles = styled.div`
    display: block;
`;

const Article = styled.button`
    display: flex;
    align-items: center;
    border-radius: 6px;
    border: 1px solid ${props => props.theme.STROKE_GREY};
    width: 100%;
    background: none;
    padding: 13px 17px;
    text-align: left;
    margin-bottom: 10px;
    cursor: pointer;
`;

const ArticleIcon = styled(Icon)`
    margin: 0 18px 0 0;
`;

const ArticleLabel = styled.div`
    width: 100%;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const GuideDefault = (props: any) => {
    const theme = useTheme();
    const { setView, openArticle } = useActions({
        setView: guideActions.setView,
        openArticle: guideActions.openArticle,
    });

    return (
        <ViewWrapper {...props}>
            <Header label={<Translation id="TR_GUIDE_VIEW_HEADLINE_LEARN_AND_DISCOVER" />} />
            <Content>
                <Section>
                    <SectionHeading>
                        <Translation id="TR_GUIDE_ARTICLES" />
                    </SectionHeading>
                    <Articles>
                        {/* TODO: replace hardcoded articles with dynamic loading of markdown files after PR #3811 is merged */}
                        <Article onClick={() => openArticle('send')}>
                            <ArticleIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                            <ArticleLabel>Send</ArticleLabel>
                        </Article>
                        <Article onClick={() => openArticle('receive')}>
                            <ArticleIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                            <ArticleLabel>Receive</ArticleLabel>
                        </Article>
                        <Article onClick={() => openArticle('buy-sell-and-trade')}>
                            <ArticleIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                            <ArticleLabel>Buy, Sell, and Trade</ArticleLabel>
                        </Article>
                        <Article onClick={() => openArticle('suite-guide')}>
                            <ArticleIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                            <ArticleLabel>Suite Guide</ArticleLabel>
                        </Article>
                        <Article onClick={() => openArticle('passphrase')}>
                            <ArticleIcon icon="ARTICLE" size={20} color={theme.TYPE_LIGHT_GREY} />
                            <ArticleLabel>Passphrase</ArticleLabel>
                        </Article>
                    </Articles>
                </Section>
            </Content>
            <FeedbackLinkWrapper onClick={() => setView('FEEDBACK_TYPE_SELECTION')}>
                <FeedbackButton>
                    <FeedbackButtonLeftIcon
                        icon="LIGHTBULB"
                        size={14}
                        color={theme.TYPE_LIGHT_GREY}
                    />
                    <FeedbackButtonLabel>
                        <Translation id="TR_GUIDE_FEEDACK_OR_SUGGESTION" />
                    </FeedbackButtonLabel>
                    <FeedbackButtonRightIcon
                        icon="ARROW_RIGHT"
                        size={16}
                        color={theme.TYPE_LIGHT_GREY}
                    />
                </FeedbackButton>
            </FeedbackLinkWrapper>
        </ViewWrapper>
    );
};

export default GuideDefault;
